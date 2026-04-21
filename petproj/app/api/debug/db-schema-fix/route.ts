import { db } from "@/db/index";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        console.log("🚀 Starting Database Schema Sync...");
        const logs: string[] = [];

        // 1. Restore 'qualifications' table
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.qualifications (
                qualification_id SERIAL PRIMARY KEY,
                qualification_name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        logs.push("✅ Table 'qualifications' checked/created.");

        // 2. Restore 'favorite_things' table (used for Pet Traits)
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.favorite_things (
                fav_thing_id SERIAL PRIMARY KEY,
                fav_thing_name VARCHAR(255) NOT NULL,
                fav_thing_category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        logs.push("✅ Table 'favorite_things' checked/created.");

        // 3. Restore Bazaar Cart tables
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.bazaar_carts (
                cart_id SERIAL PRIMARY KEY,
                user_id INTEGER,
                session_id TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                expires_at TIMESTAMP WITH TIME ZONE
            );
            
            CREATE TABLE IF NOT EXISTS public.bazaar_cart_items (
                cart_item_id SERIAL PRIMARY KEY,
                cart_id INTEGER NOT NULL REFERENCES bazaar_carts(cart_id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL,
                variant_id INTEGER,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
        `);
        logs.push("✅ Bazaar cart tables checked/created.");

        // 4. Add 'is_verified' to 'vets' table
        try {
            await db.query(`ALTER TABLE public.vets ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`);
            logs.push("✅ Column 'is_verified' added to 'vets' table.");
        } catch (colError) {
            logs.push(`⚠️ Column addition skipped/failed: ${colError instanceof Error ? colError.message : String(colError)}`);
        }

        // 5. Populate some initial data if tables are empty
        const favCheck = await db.query("SELECT COUNT(*) FROM favorite_things");
        if (parseInt(favCheck.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO favorite_things (fav_thing_name, fav_thing_category) VALUES 
                ('Playful', 'default'), ('Cuddly', 'default'), ('Quiet', 'default'), 
                ('Protective', 'default'), ('Energetic', 'default')
            `);
            logs.push("📊 Sample data added to 'favorite_things'.");
        }

        return NextResponse.json({ 
            success: true, 
            message: "Schema synchronization complete.",
            logs 
        });

    } catch (error) {
        console.error("❌ Schema Sync Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}
