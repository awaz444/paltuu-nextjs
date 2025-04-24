// app/api/rescue/shelters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import { createClient } from "../../../../db/index";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    // Get raw request body
    const formData = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      const form = new IncomingForm({ multiples: true });
      const chunks: Buffer[] = [];

      const readable = req.body?.getReader();

      if (!readable) {
        reject(new Error("Readable stream not available on req.body"));
        return;
      }

      const stream = new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await readable.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        }
      });

      const nodeReq = new (require("http").IncomingMessage)(streamToNodeReadable(stream));
      nodeReq.headers = Object.fromEntries(req.headers.entries());
      nodeReq.method = req.method;
      nodeReq.url = req.url;

      form.parse(nodeReq, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const {
      shelterName,
      address,
      description,
      accountTitle,
      iban,
      bankName,
      socials,
      animalTypes,
      capacity,
      emergencyPhone,
      backupPhone,
      vetName,
      vetPhone,
      userId,
      services,
    } = JSON.parse(formData.fields.data as string);

    await client.connect();
    await client.query("BEGIN");

    const shelterResult = await client.query(
      `INSERT INTO rescue_shelters (
        user_id, shelter_name, address, description, 
        logo_url, capacity, approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING shelter_id`,
      [
        userId,
        shelterName,
        address,
        description,
        formData.files.logo ? await saveFile(formData.files.logo[0]) : null,
        capacity,
        false,
      ]
    );

    const shelterId = shelterResult.rows[0].shelter_id;

    if (formData.files.photos) {
      const photoArray = Array.isArray(formData.files.photos)
        ? formData.files.photos
        : [formData.files.photos];

      await Promise.all(
        photoArray.map( async (photo: any) =>
          client.query(
            "INSERT INTO shelter_photos (shelter_id, photo_url) VALUES ($1, $2)",
            [shelterId, await saveFile(photo)]
          )
        )
      );
    }

    await client.query(
      `INSERT INTO shelter_bank_info (
        shelter_id, account_title, iban, bank_name
      ) VALUES ($1, $2, $3, $4)`,
      [shelterId, accountTitle, iban, bankName]
    );

    const socialsObj = JSON.parse(socials);
    await Promise.all(
      ["instagram", "facebook", "website"]
        .filter((platform) => socialsObj[platform])
        .map((platform) =>
          client.query(
            "INSERT INTO shelter_socials (shelter_id, platform, url) VALUES ($1, $2, $3)",
            [shelterId, platform, socialsObj[platform]]
          )
        )
    );

    await client.query(
      `INSERT INTO shelter_verification (
        shelter_id, reg_certificate_url, cnic_front_url, cnic_back_url
      ) VALUES ($1, $2, $3, $4)`,
      [
        shelterId,
        formData.files.regCert ? await saveFile(formData.files.regCert[0]) : null,
        formData.files.cnicFront ? await saveFile(formData.files.cnicFront[0]) : null,
        formData.files.cnicBack ? await saveFile(formData.files.cnicBack[0]) : null,
      ]
    );

    const animalTypesArray = JSON.parse(animalTypes);
    await Promise.all(
      animalTypesArray.map((animalType: number) =>
        client.query(
          "INSERT INTO shelter_animals (shelter_id, animal_type) VALUES ($1, $2)",
          [shelterId, animalType]
        )
      )
    );

    await client.query(
      `INSERT INTO shelter_emergency_contacts (
        shelter_id, primary_phone, backup_phone, vet_name, vet_phone
      ) VALUES ($1, $2, $3, $4, $5)`,
      [shelterId, emergencyPhone, backupPhone, vetName, vetPhone]
    );

    const servicesArray = JSON.parse(services);
    await Promise.all(
      servicesArray.map((service: string) =>
        client.query(
          "INSERT INTO shelter_services (shelter_id, service) VALUES ($1, $2)",
          [shelterId, service]
        )
      )
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true, shelterId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating shelter:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// Node-compatible readable stream for formidable
import { Readable } from "stream";

function streamToNodeReadable(stream: ReadableStream<Uint8Array>): Readable {
  const reader = stream.getReader();
  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) this.push(null);
      else this.push(Buffer.from(value));
    },
  });
}

async function saveFile(file: any): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, file.originalFilename || `file-${Date.now()}`);
  await fs.promises.rename(file.filepath, filePath);
  return `/uploads/${path.basename(filePath)}`;
}
