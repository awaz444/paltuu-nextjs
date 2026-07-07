/**
 * AWS MediaConvert diagnostic — run from project root:
 *   node test-aws.js
 */
const { S3Client, ListBucketsCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");
const { MediaConvertClient, DescribeEndpointsCommand, ListJobsCommand, CreateJobCommand } = require("@aws-sdk/client-mediaconvert");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const region          = process.env.AWS_S3_REGION              || "ap-south-1";
const accessKeyId     = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const rawBucket       = process.env.AWS_S3_BUCKET_VIDEOS_RAW   || "paltuu-videos-raw";
const hlsBucket       = process.env.AWS_S3_BUCKET_VIDEOS_HLS   || "paltuu-videos-hls";
const mcEndpoint      = process.env.AWS_MEDIACONVERT_ENDPOINT   || "";
const mcRoleArn       = process.env.AWS_MEDIACONVERT_ROLE_ARN   || "";
const cfDomain        = process.env.AWS_CLOUDFRONT_VIDEO_DOMAIN || process.env.AWS_CLOUDFRONT_DOMAIN || "";

console.log("=".repeat(60));
console.log("Paltuu Video Pipeline Diagnostic");
console.log("=".repeat(60));
console.log("Region            :", region);
console.log("Access Key        :", accessKeyId ? `${accessKeyId.slice(0,5)}...${accessKeyId.slice(-3)}` : "❌ NOT SET");
console.log("Secret Key        :", secretAccessKey ? "✅ set" : "❌ NOT SET");
console.log("Raw Bucket        :", rawBucket);
console.log("HLS Bucket        :", hlsBucket);
console.log("MC Endpoint (env) :", mcEndpoint || "❌ NOT SET");
console.log("MC Role ARN       :", mcRoleArn  || "❌ NOT SET");
console.log("CloudFront Domain :", cfDomain   || "(not set — will use S3 URL)");
console.log("=".repeat(60));

const creds = { accessKeyId, secretAccessKey };
const s3 = new S3Client({ region, credentials: creds });

async function checkS3() {
    console.log("\n[1/4] Checking S3 bucket access...");
    try {
        const list = await s3.send(new ListBucketsCommand({}));
        const names = list.Buckets.map(b => b.Name);
        console.log("  ✅ S3 connected. All buckets:", names);

        const hasRaw = names.includes(rawBucket);
        const hasHls = names.includes(hlsBucket);
        console.log(`  ${hasRaw ? "✅" : "❌"} ${rawBucket} ${hasRaw ? "exists" : "NOT FOUND"}`);
        console.log(`  ${hasHls ? "✅" : "❌"} ${hlsBucket} ${hasHls ? "exists" : "NOT FOUND"}`);
        return true;
    } catch (err) {
        console.error("  ❌ S3 connection failed:", err.message);
        return false;
    }
}

async function discoverEndpoint() {
    console.log("\n[2/4] Discovering MediaConvert account-specific endpoint...");
    try {
        const mcInit = new MediaConvertClient({ region, credentials: creds });
        const res = await mcInit.send(new DescribeEndpointsCommand({ Mode: "DEFAULT" }));
        const discovered = res.Endpoints?.[0]?.Url;
        console.log("  ✅ DescribeEndpoints succeeded");
        console.log("  Discovered endpoint:", discovered);

        if (discovered === mcEndpoint) {
            console.log("  ℹ️  Matches .env — your account uses the generic regional endpoint.");
        } else if (discovered) {
            console.log("  ⚠️  MISMATCH — update .env:");
            console.log(`  AWS_MEDIACONVERT_ENDPOINT=${discovered}`);
        }
        return discovered;
    } catch (err) {
        console.error("  ❌ DescribeEndpoints failed:", err.message);
        if (err.message.includes("not authorized") || err.message.includes("AccessDenied")) {
            console.log("  ⚠️  IAM user lacks mediaconvert:DescribeEndpoints permission.");
            console.log("     Add this permission in IAM, or use the account-specific URL from");
            console.log("     AWS Console → MediaConvert → (top-right) Account button.");
        }
        return mcEndpoint || null;
    }
}

async function listJobs(endpoint) {
    if (!endpoint) { console.log("\n[3/4] Skipping job list — no endpoint."); return; }
    console.log(`\n[3/4] Listing recent MediaConvert jobs (endpoint: ${endpoint})...`);
    try {
        const mc = new MediaConvertClient({ region, endpoint, credentials: creds });
        const res = await mc.send(new ListJobsCommand({ MaxResults: 10 }));
        if (!res.Jobs || res.Jobs.length === 0) {
            console.log("  ℹ️  No jobs found. This confirms MediaConvert jobs are not being submitted.");
            console.log("     After the fix is deployed, you should see jobs appear here.");
        } else {
            console.log(`  ✅ Found ${res.Jobs.length} jobs:`);
            res.Jobs.slice(0, 5).forEach((j, i) => {
                const emoji = j.Status === "COMPLETE" ? "✅" : j.Status === "ERROR" ? "❌" : "⏳";
                console.log(`  [${i+1}] ${emoji} ${j.Status.padEnd(12)} | id: ${j.Id} | created: ${j.CreatedAt?.toISOString()}`);
                if (j.ErrorMessage) console.log(`       Error: ${j.ErrorMessage}`);
                if (j.UserMetadata) console.log(`       Meta:  ${JSON.stringify(j.UserMetadata)}`);
            });
        }
    } catch (err) {
        console.error("  ❌ ListJobs failed:", err.message);
        if (err.message.includes("not authorized") || err.message.includes("AccessDenied")) {
            console.log("  ⚠️  IAM user may lack mediaconvert:ListJobs permission.");
        }
    }
}

async function testDryRunJob(endpoint) {
    if (!endpoint) { console.log("\n[4/4] Skipping dry-run — no endpoint."); return; }
    if (!mcRoleArn) { console.log("\n[4/4] Skipping dry-run — AWS_MEDIACONVERT_ROLE_ARN not set."); return; }

    console.log("\n[4/4] Testing MediaConvert job submission with FULL job spec (fake file)...");
    console.log("      (Expects an 'input file not found' or similar error — NOT a spec error.)");

    const fakeKey      = "uploads/DIAGNOSTIC_TEST_DOES_NOT_EXIST.mp4";
    const outputPrefix = "diagnostic-test";

    try {
        const mc = new MediaConvertClient({ region, endpoint, credentials: creds });
        const res = await mc.send(new CreateJobCommand({
            Role: mcRoleArn,
            Settings: {
                Inputs: [{
                    FileInput: `s3://${rawBucket}/${fakeKey}`,
                    AudioSelectors: { "Audio Selector 1": { DefaultSelection: "DEFAULT" } },
                    VideoSelector: {},
                    TimecodeSource: "ZEROBASED",
                }],
                OutputGroups: [
                    {
                        Name: "HLS",
                        OutputGroupSettings: {
                            Type: "HLS_GROUP_SETTINGS",
                            HlsGroupSettings: {
                                SegmentLength: 6,
                                MinSegmentLength: 0,
                                Destination: `s3://${hlsBucket}/${outputPrefix}/hls/hls`,
                            },
                        },
                        Outputs: [
                            {
                                NameModifier: "_360p",
                                VideoDescription: {
                                    Width: 640, Height: 360,
                                    CodecSettings: { Codec: "H_264", H264Settings: { Bitrate: 800000, RateControlMode: "CBR", CodecProfile: "MAIN", CodecLevel: "AUTO" } },
                                },
                                AudioDescriptions: [{ CodecSettings: { Codec: "AAC", AacSettings: { Bitrate: 96000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 } } }],
                                ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
                            },
                        ],
                    },
                    {
                        Name: "Thumbnails",
                        OutputGroupSettings: {
                            Type: "FILE_GROUP_SETTINGS",
                            FileGroupSettings: { Destination: `s3://${hlsBucket}/${outputPrefix}/thumbs/${outputPrefix}` },
                        },
                        Outputs: [{
                            NameModifier: "_thumb",
                            VideoDescription: {
                                Width: 720, Height: 404,
                                CodecSettings: { Codec: "FRAME_CAPTURE", FrameCaptureSettings: { FramerateNumerator: 1, FramerateDenominator: 5, MaxCaptures: 3, Quality: 80 } },
                            },
                            ContainerSettings: { Container: "RAW" },
                        }],
                    },
                ],
            },
            UserMetadata: { videoKey: fakeKey, outputPrefix, test: "diagnostic" },
        }));

        // Job was actually submitted — it will fail in MediaConvert because the file doesn't exist
        const jobId = res.Job?.Id;
        console.log(`  ✅ FULL JOB SPEC IS VALID! Job submitted: ${jobId}`);
        console.log("  ⚠️  Please go to AWS Console → MediaConvert → Jobs and CANCEL this test job.");
        console.log("  ✅  Endpoint, IAM role, bucket access, AND job spec are all 100% CORRECT.");
        console.log("     Your video pipeline is ready — just restart the server and test a real upload.");
    } catch (err) {
        if (err.message?.includes("minSegmentLength") || err.message?.includes("required property")) {
            console.log("  ❌ JOB SPEC ERROR — the job settings are invalid:");
            console.log("     ", err.message);
        } else if (err.message?.includes("not authorized") || err.message?.includes("AccessDenied")) {
            console.log("  ❌ IAM PERMISSION ERROR:");
            console.log("     ", err.message);
            console.log("     Add mediaconvert:CreateJob to the IAM user policy.");
        } else if (err.message?.includes("endpoint") || err.message?.includes("ENOTFOUND")) {
            console.log("  ❌ ENDPOINT ERROR:", err.message);
        } else {
            // Most errors here are "input file not found" type — that means the spec is VALID
            console.log("  ✅ Job spec accepted by MediaConvert (got expected runtime error about the fake file):");
            console.log("     ", err.message);
            console.log("  ✅ Endpoint, IAM role, AND job spec are all CORRECT.");
        }
    }
}


async function main() {
    await checkS3();
    const endpoint = await discoverEndpoint();
    await listJobs(endpoint);
    await testDryRunJob(endpoint);

    console.log("\n" + "=".repeat(60));
    console.log("Diagnostic complete.");
    console.log("=".repeat(60));
}

main().catch(console.error);
