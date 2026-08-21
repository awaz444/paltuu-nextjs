import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";
import { createProvider, InvalidProviderError } from "@/lib/expressVet/providers";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/providers:
 *   get:
 *     summary: Search/typeahead the Vets at Home (Express Vet) provider roster (V1)
 *     tags: [v1 Express Vet]
 *   post:
 *     summary: Create a new Vets at Home (Express Vet) provider (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim();

    const conditions: string[] = ["is_active = true"];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`$${params.length} = ANY(categories)`);
    }

    const result = await db.query(
      `SELECT * FROM express_vet_providers WHERE ${conditions.join(" AND ")} ORDER BY name ASC LIMIT 50`,
      params
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("express-vet dispatcher/providers GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const provider = await createProvider(Number(dispatcher.id || dispatcher.user_id), body);
    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidProviderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("express-vet dispatcher/providers POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
