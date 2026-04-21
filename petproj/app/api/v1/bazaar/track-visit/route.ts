import { NextRequest, NextResponse } from "next/server";
import { sendCartActivityNotification } from "@/utils/mailjet";

/**
 * @swagger
 * /api/v1/bazaar/track-visit:
 *   post:
 *     summary: Track checkout visit and send notification (V1)
 *     tags: [v1 Bazaar]
 */
export async function POST(req: NextRequest) {
    try {
        const activityData = await req.json();
        
        // Add activity type if not present
        if (!activityData.activity_type) {
            activityData.activity_type = 'checkout_visit';
        }

        // Trigger notification (non-blocking)
        sendCartActivityNotification(activityData).catch(err => {
            console.error("Failed to send checkout tracking email:", err);
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("V1 Track Visit Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
