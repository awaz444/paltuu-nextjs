import { db } from "@/db/index";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 1. Check if table exists
        const checkResult = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications'
            );
        `);
        
        const exists = checkResult.rows[0].exists;
        
        if (!exists) {
            console.log("🛠️ Notifications table missing. Creating now...");
            await db.query(`
                CREATE TABLE IF NOT EXISTS public.notifications (
                    notification_id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    notification_content TEXT NOT NULL,
                    notification_type VARCHAR(50),
                    date_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_read BOOLEAN DEFAULT false
                );
            `);
            return NextResponse.json({ message: "Table was missing and has been created." });
        }

        // 2. If it exists, check row count for the current session (optional debug)
        const countResult = await db.query("SELECT COUNT(*) FROM notifications");

        return NextResponse.json({ 
            exists: true, 
            rowCount: countResult.rows[0].count,
            message: "Notifications table is present."
        });
    } catch (error) {
        console.error("Debug Route Error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
