import { NextRequest, NextResponse } from 'next/server';
import { getPool, query as dbQuery } from '../../../../db/ecom';
import { sendCartActivityNotification } from '../../../../utils/mailjet';
import { getUserIdFromRequest } from '../../../../utils/authServer';

export const revalidate = 0;

// GET cart for user or session
export async function GET(req: NextRequest) {
  const pool = getPool();
  try {
    // Extract userId from server-side cookie (secure)
    const userId = await getUserIdFromRequest(req);

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    console.log('📥 Cart API GET - Authenticated userId:', userId, 'SessionId:', sessionId);

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication or session required' }, { status: 401 });
    }

  // using pool; no explicit connect required

    // ✅ ALWAYS prioritize userId over sessionId if both are provided
    const useUserId = userId ? true : false;
    console.log(`🎯 Cart API GET - Fetching cart for ${useUserId ? 'userId' : 'sessionId'}:`, useUserId ? userId : sessionId);

    // Find or create cart
    let cartQuery = `
      SELECT cart_id, user_id, session_id, created_at, updated_at, expires_at
      FROM bazaar_carts
      WHERE ${useUserId ? 'user_id = $1' : 'session_id = $1'}
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

  const cartResult = await pool.query(cartQuery, [useUserId ? userId : sessionId]);

    if (cartResult.rows.length === 0) {
      // Create new cart
      const createCartQuery = `
        INSERT INTO bazaar_carts (user_id, session_id, created_at, updated_at, expires_at)
        VALUES ($1, $2, NOW(), NOW(), NOW() + INTERVAL '30 days')
        RETURNING *
      `;
  const newCartResult = await pool.query(createCartQuery, [userId || null, sessionId || null]);
      const cart = newCartResult.rows[0];

      return NextResponse.json({
        cart,
        items: []
      });
    }

    const cart = cartResult.rows[0];

    // Get cart items with product details
    const itemsQuery = `
      SELECT
        ci.cart_item_id,
        ci.cart_id,
        ci.product_id,
        ci.variant_id,
        ci.quantity,
        ci.added_at,
  p.title as product_title,
  p.price as product_price,
  p.slug as product_slug,
  COALESCE((SELECT SUM(stock) FROM bazaar_product_variants pv2 WHERE pv2.product_id = p.product_id), 0) as product_stock,
        pv.title as variant_title,
        pv.price_override as variant_price,
        pv.stock as variant_stock,
        pv.attributes as variant_attributes,
        COALESCE(pv.price_override, p.price) as effective_price,
        COALESCE((SELECT url FROM bazaar_product_media WHERE product_id = p.product_id AND is_primary = true LIMIT 1),
                 (SELECT url FROM bazaar_product_media WHERE product_id = p.product_id ORDER BY ordering LIMIT 1)) as image_url
      FROM bazaar_cart_items ci
      JOIN bazaar_products p ON ci.product_id = p.product_id
      LEFT JOIN bazaar_product_variants pv ON ci.variant_id = pv.variant_id
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at DESC
    `;

  const itemsResult = await pool.query(itemsQuery, [cart.cart_id]);

    return NextResponse.json({
      cart,
      items: itemsResult.rows
    });

  } catch (err) {
    console.error('Cart fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  } finally {
    // no client.end() when using pooled connections
  }
}

// POST - Add item to cart
export async function POST(req: NextRequest) {
  const pool = getPool();
  try {
    // Extract userId from server-side cookie (secure)
    const userId = await getUserIdFromRequest(req);

    const body = await req.json();
    const { sessionId, productId, variantId, quantity = 1 } = body;

    console.log('📥 Cart API POST - Authenticated userId:', userId, 'SessionId:', sessionId, 'Product:', productId);

    if (!productId || (!userId && !sessionId)) {
      return NextResponse.json({ error: 'Product ID and authentication required' }, { status: 400 });
    }

  // using pool; no explicit connect required

    // ✅ ALWAYS prioritize userId over sessionId if both are provided
    const useUserId = userId ? true : false;
    console.log(`🎯 Cart API POST - Using ${useUserId ? 'userId' : 'sessionId'}:`, useUserId ? userId : sessionId);

    // Find or create cart
    let cartQuery = `
      SELECT cart_id FROM bazaar_carts
      WHERE ${useUserId ? 'user_id = $1' : 'session_id = $1'}
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

  let cartResult = await pool.query(cartQuery, [useUserId ? userId : sessionId]);

    let cartId;
    if (cartResult.rows.length === 0) {
      const createCartQuery = `
        INSERT INTO bazaar_carts (user_id, session_id, created_at, updated_at, expires_at)
        VALUES ($1, $2, NOW(), NOW(), NOW() + INTERVAL '30 days')
        RETURNING cart_id
      `;
  const newCartResult = await pool.query(createCartQuery, [userId || null, sessionId || null]);
      cartId = newCartResult.rows[0].cart_id;
    } else {
      cartId = cartResult.rows[0].cart_id;
    }

    // Check if item already exists in cart
    const existingItemQuery = `
      SELECT cart_item_id, quantity FROM bazaar_cart_items
      WHERE cart_id = $1 AND product_id = $2 AND ($3::int IS NULL AND variant_id IS NULL OR variant_id = $3)
    `;
  const existingItemResult = await pool.query(existingItemQuery, [cartId, productId, variantId]);

    if (existingItemResult.rows.length > 0) {
      // Update quantity
      const updateQuery = `
        UPDATE bazaar_cart_items
        SET quantity = quantity + $1, updated_at = NOW()
        WHERE cart_item_id = $2
        RETURNING *
      `;
      const updateResult = await pool.query(updateQuery, [quantity, existingItemResult.rows[0].cart_item_id]);

      // Send cart activity notification (non-blocking)
      try {
        const productResult = await pool.query(
          'SELECT title FROM bazaar_products WHERE product_id = $1',
          [productId]
        );
        const productName = productResult.rows[0]?.title || 'Unknown Product';

        // Send notification with available data
        sendCartActivityNotification({
          activity_type: 'add_to_cart',
          user_email: undefined, // Email not available in ecom DB
          user_name: undefined,  // Name not available in ecom DB
          user_id: userId ? parseInt(userId, 10) : undefined,
          session_id: sessionId,
          product_name: productName,
        }).catch((err) => console.warn('Failed to send cart activity notification', err));
      } catch (e) {
        console.warn('Cart activity notification scheduling failed', e);
      }

      return NextResponse.json(updateResult.rows[0]);
    } else {
      // Add new item
      const insertQuery = `
        INSERT INTO bazaar_cart_items (cart_id, product_id, variant_id, quantity, added_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;
      const insertResult = await pool.query(insertQuery, [cartId, productId, variantId, quantity]);

      // Send cart activity notification (non-blocking)
      try {
        const productResult = await pool.query(
          'SELECT title FROM bazaar_products WHERE product_id = $1',
          [productId]
        );
        const productName = productResult.rows[0]?.title || 'Unknown Product';

        // Send notification with available data
        sendCartActivityNotification({
          activity_type: 'add_to_cart',
          user_email: undefined, // Email not available in ecom DB
          user_name: undefined,  // Name not available in ecom DB
          user_id: userId ? parseInt(userId, 10) : undefined,
          session_id: sessionId,
          product_name: productName,
        }).catch((err) => console.warn('Failed to send cart activity notification', err));
      } catch (e) {
        console.warn('Cart activity notification scheduling failed', e);
      }

      return NextResponse.json(insertResult.rows[0]);
    }

  } catch (err) {
    console.error('Add to cart error:', err);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  } finally {
    // no client.end() when using pooled connections
  }
}

// PUT - Update cart item quantity
export async function PUT(req: NextRequest) {
  const pool = getPool();
  try {
    const body = await req.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

  // using pool; no explicit connect required

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      const deleteQuery = `DELETE FROM bazaar_cart_items WHERE cart_item_id = $1 RETURNING *`;
  const deleteResult = await pool.query(deleteQuery, [cartItemId]);
      return NextResponse.json({ deleted: true, item: deleteResult.rows[0] });
    } else {
      // Update quantity
      const updateQuery = `
        UPDATE bazaar_cart_items
        SET quantity = $1, updated_at = NOW()
        WHERE cart_item_id = $2
        RETURNING *
      `;
  const updateResult = await pool.query(updateQuery, [quantity, cartItemId]);
      return NextResponse.json(updateResult.rows[0]);
    }

  } catch (err) {
    console.error('Update cart error:', err);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  } finally {
    // no client.end() when using pooled connections
  }
}

// DELETE - Remove item from cart
export async function DELETE(req: NextRequest) {
  const pool = getPool();
  try {
    const { searchParams } = new URL(req.url);
    let cartItemId = searchParams.get('cartItemId');

    // If not provided in query, attempt to read JSON body (some clients send DELETE with body)
    let body: any = null;
    if (!cartItemId) {
      try {
        body = await req.json();
        cartItemId = body?.cartItemId ?? body?.cart_item_id ?? null;
      } catch (e) {
        // ignore JSON parse errors
      }
    }

    if (!cartItemId) {
      console.warn('Delete cart called without cartItemId', { url: req.url, body });
      return NextResponse.json({ error: 'Cart item ID is required' }, { status: 400 });
    }

  // using pool; no explicit connect required

    // coerce numeric ids to number when possible
    const param = typeof cartItemId === 'string' && /^\d+$/.test(cartItemId) ? Number(cartItemId) : cartItemId;
    console.log('Deleting cart item', { cartItemId: param });

    const deleteQuery = `DELETE FROM bazaar_cart_items WHERE cart_item_id = $1 RETURNING *`;
  const deleteResult = await pool.query(deleteQuery, [param]);

    if (deleteResult.rows.length === 0) {
      // Item was already deleted or doesn't exist - this is actually a success case
      // since the desired end state (item not in cart) is achieved
      console.log(`Cart item ${param} was already deleted or doesn't exist - treating as success`);
      return NextResponse.json({
        deleted: true,
        item: null,
        message: 'Item was already removed from cart'
      });
    }

    console.log(`Successfully deleted cart item ${param}`);
    return NextResponse.json({ deleted: true, item: deleteResult.rows[0] });

  } catch (err) {
    console.error('Delete cart item error:', err);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  } finally {
    // no client.end() when using pooled connections
  }
}
