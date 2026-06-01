import { NextRequest, NextResponse } from "next/server";
import { uploadToS3Main } from "@/lib/s3";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * POST /api/v1/admin/upload-clinic-logo
 * Upload a clinic logo to AWS S3 (paltuu-main/clinics/)
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        // Validate size — 5 MB max
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
        }

        const buffer    = Buffer.from(await file.arrayBuffer());
        const ext       = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
        const mimeType  = file.type;

        // Upload to paltuu-main/clinics/
        const url = await uploadToS3Main(buffer, "clinics", mimeType, ext);

        return NextResponse.json({ url, image_url: url }); // image_url for backwards compat
    } catch (error) {
        console.error("upload-clinic-logo error:", error);
        const msg = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
