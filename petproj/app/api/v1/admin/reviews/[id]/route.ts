import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../../adminAuth";

export const dynamic = "force-dynamic";

function reviewId(raw: string): number | null {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * POST /api/v1/admin/reviews/:id  { action: "approve" | "unapprove" }
 * Publishes a vet or clinic review, or takes a published one back down.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    if (!(await checkAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = reviewId(params.id);
    if (!id) return NextResponse.json({ error: "Bad review id" }, { status: 400 });

    const { action } = await req.json().catch(() => ({}));
    if (action !== "approve" && action !== "unapprove") {
        return NextResponse.json({ error: "action must be approve or unapprove" }, { status: 400 });
    }

    try {
        const result = await db.query(
            "UPDATE vet_reviews SET is_approved = $1 WHERE review_id = $2 RETURNING review_id, is_approved",
            [action === "approve", id]
        );
        if (result.rowCount === 0) return NextResponse.json({ error: "Review not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("V1 Admin review POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/v1/admin/reviews/:id — removes a spam or abusive review for good. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    if (!(await checkAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = reviewId(params.id);
    if (!id) return NextResponse.json({ error: "Bad review id" }, { status: 400 });

    try {
        const result = await db.query("DELETE FROM vet_reviews WHERE review_id = $1", [id]);
        if (result.rowCount === 0) return NextResponse.json({ error: "Review not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("V1 Admin review DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
