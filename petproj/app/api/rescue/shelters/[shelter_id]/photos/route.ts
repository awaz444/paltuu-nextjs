import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../db/index";

export async function POST(req: NextRequest, { params }: { params: { shelter_id: string } }): Promise<NextResponse> {
  const client = createClient();
  const { shelter_id } = params;

  if (!shelter_id || isNaN(parseInt(shelter_id))) {
    return NextResponse.json(
      { error: "Valid shelter ID is required" },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { photo_url } = await req.json();
    if (!photo_url) {
      return NextResponse.json(
        { error: "photo_url is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await client.connect();
    const result = await client.query(
      "INSERT INTO shelter_photos (shelter_id, photo_url) VALUES ($1, $2) RETURNING photo_id, photo_url",
      [shelter_id, photo_url]
    );

    return NextResponse.json({ success: true, photo: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.end();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { shelter_id: string } }): Promise<NextResponse> {
  const client = createClient();
  const { shelter_id } = params;

  if (!shelter_id || isNaN(parseInt(shelter_id))) {
    return NextResponse.json(
      { error: "Valid shelter ID is required" },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { photo_url, photo_id } = await req.json();
    if (!photo_url && !photo_id) {
      return NextResponse.json(
        { error: "photo_url or photo_id is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await client.connect();
    const result = await client.query(
      photo_id
        ? "DELETE FROM shelter_photos WHERE shelter_id = $1 AND photo_id = $2 RETURNING photo_id"
        : "DELETE FROM shelter_photos WHERE shelter_id = $1 AND photo_url = $2 RETURNING photo_id",
      photo_id ? [shelter_id, photo_id] : [shelter_id, photo_url]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.end();
  }
}


