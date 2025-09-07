// app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import jwt from "jsonwebtoken";

/** Helper: decode server JWT cookie to get user id (if logged in) */
function getUserId(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.TOKEN_SECRET!);
    return decoded.id; // your user_id in token
  } catch {
    return null;
  }
}

/** Helper: get guest session_id from header or query param */
function getSessionIdFromReq(req: NextRequest) {
  const header = req.headers.get("x-guest-token"); // 👈 guest token = session_id
  if (header) return header;
  const url = new URL(req.url);
  return url.searchParams.get("guest_token");
}

/** Helper: determine owner (user or guest) */
function getOwner(req: NextRequest) {
  const userId = getUserId(req);
  const sessionId = getSessionIdFromReq(req);
  return { userId, sessionId };
}

/* ----------------------
   GET /api/cart
-----------------------*/
export async function GET(req: NextRequest) {
  const { userId, sessionId } = getOwner(req);

  if (!userId && !sessionId) {
    return NextResponse.json([]); // no cart
  }

  const field = userId ? "user_id" : "session_id";
  const id = userId ?? sessionId;

  try {
    const { rows } = await db.query(
      `
      SELECT
        ci.cart_item_id AS item_id,
        ci.product_id,
        ci.quantity,
        bp.title,
        bp.price,
        COALESCE(
          (SELECT url FROM bazaar_product_media m 
           WHERE m.product_id = bp.product_id 
           ORDER BY m.ordering ASC LIMIT 1),
          null
        ) AS image
      FROM bazaar_carts c
      JOIN bazaar_cart_items ci ON ci.cart_id = c.cart_id
      JOIN bazaar_products bp ON ci.product_id = bp.product_id
      WHERE c.${field} = $1
      ORDER BY ci.added_at ASC
      `,
      [id]
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ----------------------
   POST /api/cart
   body: { product_id, quantity }
-----------------------*/
export async function POST(req: NextRequest) {
  const { userId, sessionId } = getOwner(req);
  const body = await req.json();
  const { product_id, quantity = 1 } = body;

  if (!product_id) {
    return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
  }
  if (!userId && !sessionId) {
    return NextResponse.json({ error: "Missing auth or session_id" }, { status: 400 });
  }

  const field = userId ? "user_id" : "session_id";
  const id = userId ?? sessionId;

  try {
    await db.query("BEGIN");

    // find or create cart
    const cartRes = await db.query(
      `SELECT cart_id FROM bazaar_carts WHERE ${field} = $1 LIMIT 1`,
      [id]
    );
    let cartId = cartRes.rows[0]?.cart_id;
    if (!cartId) {
      const insertRes = await db.query(
        `INSERT INTO bazaar_carts (${field}, created_at, updated_at, expires_at) 
         VALUES ($1, NOW(), NOW(), NOW() + INTERVAL '30 days') 
         RETURNING cart_id`,
        [id]
      );
      cartId = insertRes.rows[0].cart_id;
    }

    // upsert item
    const existing = await db.query(
      `SELECT cart_item_id, quantity 
       FROM bazaar_cart_items 
       WHERE cart_id = $1 AND product_id = $2 LIMIT 1`,
      [cartId, product_id]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE bazaar_cart_items 
         SET quantity = quantity + $1, updated_at = NOW() 
         WHERE cart_item_id = $2`,
        [quantity, existing.rows[0].cart_item_id]
      );
    } else {
      await db.query(
        `INSERT INTO bazaar_cart_items (cart_id, product_id, quantity, added_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [cartId, product_id, quantity]
      );
    }

    await db.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    await db.query("ROLLBACK");
    console.error("POST /api/cart error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ----------------------
   PUT /api/cart
   body: { item_id, quantity }
-----------------------*/
export async function PUT(req: NextRequest) {
  const { userId, sessionId } = getOwner(req);
  const body = await req.json();
  const { item_id, quantity } = body;

  if (!item_id || typeof quantity !== "number") {
    return NextResponse.json({ error: "Missing item_id or quantity" }, { status: 400 });
  }
  if (!userId && !sessionId) {
    return NextResponse.json({ error: "Missing auth or session_id" }, { status: 400 });
  }

  const field = userId ? "user_id" : "session_id";
  const id = userId ?? sessionId;

  try {
    const result = await db.query(
      `
      UPDATE bazaar_cart_items
      SET quantity = $1, updated_at = NOW()
      FROM bazaar_carts
      WHERE bazaar_cart_items.cart_item_id = $3
        AND bazaar_cart_items.cart_id = bazaar_carts.cart_id
        AND bazaar_carts.${field} = $2
      RETURNING bazaar_cart_items.cart_item_id
      `,
      [quantity, id, item_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PUT /api/cart error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ----------------------
   DELETE /api/cart
   body: { item_id }
-----------------------*/
export async function DELETE(req: NextRequest) {
  const { userId, sessionId } = getOwner(req);
  const body = await req.json();
  const { item_id } = body;

  if (!item_id) {
    return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
  }
  if (!userId && !sessionId) {
    return NextResponse.json({ error: "Missing auth or session_id" }, { status: 400 });
  }

  const field = userId ? "user_id" : "session_id";
  const id = userId ?? sessionId;

  try {
    const result = await db.query(
      `
      DELETE FROM bazaar_cart_items
      USING bazaar_carts
      WHERE bazaar_cart_items.cart_item_id = $1
        AND bazaar_cart_items.cart_id = bazaar_carts.cart_id
        AND bazaar_carts.${field} = $2
      RETURNING bazaar_cart_items.cart_item_id
      `,
      [item_id, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/cart error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
