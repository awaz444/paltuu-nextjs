import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '../../../../db/index';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  const client = createClient();
  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[];
    const product_id = data.get('product_id');
    if (!product_id) return NextResponse.json({ error: 'product_id missing' }, { status: 400 });
    if (!files || files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

    const uploadPromises = files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Promise<string>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        });
        upload.end(buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);
    await client.connect();
    for (let i = 0; i < urls.length; i++) {
      await client.query('INSERT INTO bazaar_product_media (product_id, url, ordering, created_at) VALUES ($1,$2,$3,NOW())', [product_id, urls[i], i+1]);
    }

    return NextResponse.json({ message: 'Images uploaded', urls }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed', message: (err as Error).message }, { status: 500 });
  } finally {
    try { await client.end(); } catch {};
  }
}
