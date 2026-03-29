import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest, { params }: { params: { shop_id: string } }): Promise<NextResponse> {
    const client = createClient();
    const { shop_id } = params;

    if (!shop_id || isNaN(parseInt(shop_id))) {
        return NextResponse.json(
            { error: "Valid shop ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Query to fetch shop details along with related information
        const shopQuery = `
        SELECT 
            s.shop_id,
            s.shop_name,
            s.address,
            s.created_at,
            s.logo_url,
            u.user_id,
            u.name as contact_name,
            u.email,
            u.phone_number,
            u.profile_image_url as contact_image,
            sbi.account_title,
            sbi.iban,
            sbi.bank_name,
            ss.platform as social_platform,
            ss.url as social_url
        FROM shops s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN shop_bank_info sbi ON s.shop_id = sbi.shop_id
        LEFT JOIN shop_socials ss ON s.shop_id = ss.shop_id
        WHERE s.shop_id = $1
        `;

        const shopResult = await client.query(shopQuery, [shop_id]);

        if (shopResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Shop not found" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Query to fetch available pets for this shop
        const petsQuery = `
        SELECT 
            p.pet_id,
            p.pet_name,
            p.pet_type,
            p.pet_breed,
            p.age,
            p.months,
            p.description,
            p.adoption_status,
            p.price,
            p.sex,
            p.listing_type,
            p.vaccinated,
            p.neutered,
            p.created_at,
            c.city_name as city,
            pi.image_id,
            pi.image_url,
            pi.order as image_order
        FROM pets p
        JOIN cities c ON p.city_id = c.city_id
        LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
        WHERE p.shop_id = $1 
            AND p.adoption_status = 'available'
            AND p.approved = true
        ORDER BY p.created_at DESC
        `;

        const petsResult = await client.query(petsQuery, [shop_id]);

        // Process shop data
        const shopData = shopResult.rows[0];
        const response: any = {
            shop_id: shopData.shop_id,
            shop_name: shopData.shop_name,
            address: shopData.address,
            logo_url: shopData.logo_url,
            created_at: shopData.created_at,
            contact: {
                user_id: shopData.user_id,
                name: shopData.contact_name,
                email: shopData.email,
                phone_number: shopData.phone_number,
                profile_image_url: shopData.contact_image
            },
            bank_info: shopData.account_title ? {
                account_title: shopData.account_title,
                iban: shopData.iban,
                bank_name: shopData.bank_name
            } : null,
            social_media: []
        };

        // Process related data that might have multiple rows
        shopResult.rows.forEach((row: any) => {
            if (row.social_platform && !response.social_media.find((s: any) => s.platform === row.social_platform)) {
                response.social_media.push({
                    platform: row.social_platform,
                    url: row.social_url
                });
            }
        });

        // Process pets data
        const petsMap = new Map();
        petsResult.rows.forEach((row: any) => {
            if (!petsMap.has(row.pet_id)) {
                petsMap.set(row.pet_id, {
                    pet_id: row.pet_id,
                    pet_name: row.pet_name,
                    pet_type: row.pet_type,
                    pet_breed: row.pet_breed,
                    age: row.age,
                    months: row.months,
                    description: row.description,
                    adoption_status: row.adoption_status,
                    price: row.price,
                    sex: row.sex,
                    listing_type: row.listing_type,
                    vaccinated: row.vaccinated,
                    neutered: row.neutered,
                    created_at: row.created_at,
                    city: row.city,
                    images: []
                });
            }
            
            if (row.image_id) {
                const pet = petsMap.get(row.pet_id);
                pet.images.push({
                    image_id: row.image_id,
                    image_url: row.image_url,
                    order: row.image_order
                });
            }
        });

        response.pets = Array.from(petsMap.values());

        return NextResponse.json(response, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
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

export async function PUT(req: NextRequest, { params }: { params: { shop_id: string } }): Promise<NextResponse> {
    const client = createClient();
    const { shop_id } = params;

    if (!shop_id || isNaN(parseInt(shop_id))) {
        return NextResponse.json(
            { error: "Valid shop ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();
        const body = await req.json();
        
        const {
            shop_name,
            address,
            contact_name,
            email,
            phone_number,
            account_title,
            iban,
            bank_name,
            social_media,
            logo_url
        } = body;

        await client.query('BEGIN');

        // Update shop basic info
        await client.query(
            'UPDATE shops SET shop_name = $1, address = $2, logo_url = $3 WHERE shop_id = $4',
            [shop_name, address, logo_url, shop_id]
        );

        // Get user_id from shop
        const userResult = await client.query('SELECT user_id FROM shops WHERE shop_id = $1', [shop_id]);
        const userId = userResult.rows[0].user_id;

        // Update user contact info
        await client.query(
            'UPDATE users SET name = $1, email = $2, phone_number = $3 WHERE user_id = $4',
            [contact_name, email, phone_number, userId]
        );

        // Update or insert bank info
        const bankExists = await client.query('SELECT bank_id FROM shop_bank_info WHERE shop_id = $1', [shop_id]);
        
        if (bankExists.rows.length > 0) {
            await client.query(
                'UPDATE shop_bank_info SET account_title = $1, iban = $2, bank_name = $3 WHERE shop_id = $4',
                [account_title, iban, bank_name, shop_id]
            );
        } else {
            await client.query(
                'INSERT INTO shop_bank_info (shop_id, account_title, iban, bank_name) VALUES ($1, $2, $3, $4)',
                [shop_id, account_title, iban, bank_name]
            );
        }

        // Update social media
        await client.query('DELETE FROM shop_socials WHERE shop_id = $1', [shop_id]);
        
        if (social_media && social_media.length > 0) {
            for (const social of social_media) {
                if (social.platform && social.url) {
                    await client.query(
                        'INSERT INTO shop_socials (shop_id, platform, url) VALUES ($1, $2, $3)',
                        [shop_id, social.platform, social.url]
                    );
                }
            }
        }

        await client.query('COMMIT');

        return NextResponse.json(
            { message: "Shop profile updated successfully" },
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}