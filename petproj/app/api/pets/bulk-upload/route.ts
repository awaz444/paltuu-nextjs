/**
 * @swagger
 * /api/pets/bulk-upload:
 *   post:
 *     summary: Auto-generated summary for /api/pets/bulk-upload
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";
import { sendNewListingNotification } from "../../../../utils/mailjet";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    const { pets, entityType, entityId } = await req.json();

    if (!pets || !Array.isArray(pets) || pets.length === 0) {
      return NextResponse.json(
        { error: "No pets provided for bulk upload" },
        { status: 400 }
      );
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Entity type and ID are required" },
        { status: 400 }
      );
    }

    if (!['shop', 'shelter'].includes(entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type. Must be 'shop' or 'shelter'" },
        { status: 400 }
      );
    }

    await client.connect();
    await client.query("BEGIN");

    const results = [];
    const errors = [];

    for (let i = 0; i < pets.length; i++) {
      const pet = pets[i];

      try {
        // Validate required fields
        if (!pet.pet_name || !pet.pet_type || !pet.description) {
          throw new Error(`Pet ${i + 1}: Missing required fields`);
        }

        if (!pet.age && !pet.months) {
          throw new Error(`Pet ${i + 1}: Age or months is required`);
        }

        if (entityType === 'shop' && (!pet.price || pet.price <= 0)) {
          throw new Error(`Pet ${i + 1}: Price is required for shop listings`);
        }

        // Check if the entity exists in the database
        let validEntityId = null;
        if (entityId && entityId !== 1) { // Only use entityId if it's not the default demo ID
          const entityCheckQuery = entityType === 'shop'
            ? 'SELECT shop_id FROM shops WHERE shop_id = $1'
            : 'SELECT shelter_id FROM rescue_shelters WHERE shelter_id = $1';

          const entityResult = await client.query(entityCheckQuery, [entityId]);
          if (entityResult.rows.length > 0) {
            validEntityId = entityId;
          }
        }

        // Prepare pet data
        const petData = {
          owner_id: pet.owner_id,
          pet_name: pet.pet_name,
          pet_type: pet.pet_type,
          pet_breed: pet.pet_breed || null,
          city_id: pet.city_id || null,
          area: pet.area || '',
          age_months: ((pet.age || 0) * 12) + (pet.months || 0),
          contact_number: pet.contact_number || null,
          description: pet.description,
          adoption_status: 'available',
          price: entityType === 'shop' ? pet.price : null,
          min_age_of_children: pet.min_age_of_children || null,
          can_live_with_dogs: pet.can_live_with_dogs || null,
          can_live_with_cats: pet.can_live_with_cats || null,
          must_have_someone_home: pet.must_have_someone_home || null,
          energy_level: pet.energy_level || 3,
          cuddliness_level: pet.cuddliness_level || 3,
          health_issues: pet.health_issues || null,
          sex: pet.sex || 'male',
          listing_type: entityType === 'shop' ? 'shop' : 'rescue',
          vaccinated: pet.vaccinated || false,
          neutered: pet.neutered || false,
          rescue_story: entityType === 'shelter' ? (pet.rescue_story || null) : null,
          shop_id: entityType === 'shop' ? validEntityId : null,
          shelter_id: entityType === 'shelter' ? validEntityId : null
        };

        // Insert pet record
        const insertQuery = `
          INSERT INTO pets (
            owner_id, pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
            description, adoption_status, price, min_age_of_children, can_live_with_dogs,
            can_live_with_cats, must_have_someone_home, energy_level, cuddliness_level,
            health_issues, sex, listing_type, vaccinated, neutered, rescue_story, shop_id, shelter_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
          ) RETURNING pet_id
        `;

        const values = [
          petData.owner_id,
          petData.pet_name,
          petData.pet_type,
          petData.pet_breed,
          petData.city_id,
          petData.area,
          petData.age_months,
          petData.contact_number,
          petData.description,
          petData.adoption_status,
          petData.price,
          petData.min_age_of_children,
          petData.can_live_with_dogs,
          petData.can_live_with_cats,
          petData.must_have_someone_home,
          petData.energy_level,
          petData.cuddliness_level,
          petData.health_issues,
          petData.sex,
          petData.listing_type,
          petData.vaccinated,
          petData.neutered,
          petData.rescue_story, // rescue_story
          petData.shop_id, // shop_id
          petData.shelter_id // shelter_id
        ];

        const result = await client.query(insertQuery, values);
        const petId = result.rows[0].pet_id;

        // Save images if provided
        if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
          for (let j = 0; j < pet.images.length; j++) {
            await client.query(
              'INSERT INTO pet_images (pet_id, image_url, "order") VALUES ($1, $2, $3)',
              [petId, pet.images[j], j + 1]
            );
          }
        }

        // Create notifications for admins
        const adminResult = await client.query(
          "SELECT user_id FROM users WHERE role = 'admin'"
        );
        const adminUserIds = adminResult.rows.map((row: any) => row.user_id);

        for (const adminId of adminUserIds) {
          await client.query(
            `INSERT INTO notifications (user_id, notification_content, notification_type, date_sent, is_read)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false)`,
            [
              adminId,
              `New ${entityType} pet listing "${pet.pet_name}" requires approval`,
              'pet_approval'
            ]
          );
        }

        // Send email notification to admin (non-blocking)
        try {
          // Get owner details
          const ownerResult = await client.query(
            "SELECT name, email FROM users WHERE user_id = $1",
            [petData.owner_id]
          );
          const ownerInfo = ownerResult.rows[0] || {};

          sendNewListingNotification({
            pet_id: petId,
            pet_name: pet.pet_name,
            pet_type: petData.pet_type,
            listing_type: petData.listing_type || entityType,
            owner_name: ownerInfo.name,
            owner_email: ownerInfo.email,
          }).catch((err) => console.warn('Failed to send new listing email', err));
        } catch (e) {
          console.warn('Email notification scheduling failed', e);
        }

        results.push({
          pet_id: petId,
          pet_name: pet.pet_name,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error creating pet ${i + 1}:`, error);
        errors.push({
          pet_index: i + 1,
          pet_name: pet.pet_name || `Pet ${i + 1}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (results.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: "No pets were successfully created",
          details: errors
        },
        { status: 400 }
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: `Successfully created ${results.length} out of ${pets.length} pets`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during bulk upload",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
