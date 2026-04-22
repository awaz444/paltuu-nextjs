import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * Helper to get vendor_id and verify ownership
 */
async function verifyInventoryOwnership(userId: string, inventoryId: string) {
    const res = await db.query(`
        SELECT vi.inventory_id, vi.vendor_id 
        FROM vendor_inventory vi
        JOIN vendors v ON vi.vendor_id = v.vendor_id
        WHERE v.user_id = $1 AND vi.inventory_id = $2
    `, [userId, inventoryId]);
    return res.rows[0];
}

/**
 * PATCH /api/v1/vendors/inventory/[id]
 * Update specific inventory item (Price, Stock, Status)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const inventoryId = params.id;
        const ownership = await verifyInventoryOwnership(userId, inventoryId);
        if (!ownership) {
            return NextResponse.json({ error: "Inventory item not found or unauthorized" }, { status: 404 });
        }

        const body = await req.json();
        const allowedUpdates = [
            'selling_price', 'original_price', 'discount_percent',
            'stock_count', 'is_available', 'custom_title', 'custom_sku', 'custom_image_url'
        ];

        const setClause: string[] = [];
        const updateParams: any[] = [inventoryId];

        Object.keys(body).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                updateParams.push(body[key]);
                setClause.push(`${key} = $${updateParams.length}`);
            }
        });

        if (setClause.length === 0) {
            return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
        }

        const query = `
            UPDATE vendor_inventory 
            SET ${setClause.join(', ')}, updated_at = NOW() 
            WHERE inventory_id = $1 
            RETURNING *
        `;

        const result = await db.query(query, updateParams);
        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Inventory PATCH error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/vendors/inventory/[id]
 * Remove an item from vendor inventory
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const inventoryId = params.id;
        const ownership = await verifyInventoryOwnership(userId, inventoryId);
        if (!ownership) {
            return NextResponse.json({ error: "Inventory item not found or unauthorized" }, { status: 404 });
        }

        await db.query("DELETE FROM vendor_inventory WHERE inventory_id = $1", [inventoryId]);
        
        return NextResponse.json({ success: true, message: "Item removed from inventory" });

    } catch (error) {
        console.error("V1 Inventory DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
