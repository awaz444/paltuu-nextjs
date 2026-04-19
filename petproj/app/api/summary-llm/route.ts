/**
 * @swagger
 * /api/summary-llm:
 *   post:
 *     summary: Auto-generated summary for /api/summary-llm
 *     tags: [Auto-Generated]
 */

// route.ts - Updated with listing type specific prompts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

const systemPrompt = `You are a chatbot that only provides answers related to pets (animal care, breeds, adoption, health),
Moreover, this website u are being used on is Paltuu, based in Pakistan - It is a comprehensive Pet adoption/foster
and pet care platform, It features a browse-pets page where users can adopt/buy pets, a Foster pets page where users
can apply to foster pets, a Pet care page where users can connect with Vets across the country for medical help and and Lost
& found page where users can post on found/missing pets across the country`;

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { prompt, petData } = body;
        
        // If petData is provided, generate a pet summary based on listing type
        if (petData) {
            let petSummaryPrompt = '';
            
            // Determine prompt based on listing type
            switch (petData.listing_type) {
                case "adoption":
                case "rescue":
                    petSummaryPrompt = `
                    You are a chatbot for Paltuu.pk, a Pakistan-based pet adoption platform. Generate an adoption-focused description.

                    PET DATA:
                    ${JSON.stringify(petData)}

                    TASK: Create an adoption guidance summary that helps potential adopters understand what's needed.

                    FOCUS ON:
                    1. ADOPTION PREPARATION:
                       - Specific care requirements (feeding schedule, exercise needs, grooming)
                       - Space and environment needs (indoor/outdoor, cage size, temperature)
                       - Time commitment and daily routine

                    2. PRECAUTIONS & SAFETY:
                       - Handling instructions (especially if the pet has special needs)
                       - Transportation safety tips
                       - Introduction to other pets/family members
                       - Any health precautions or vaccination requirements

                    3. COMPATIBILITY ASSESSMENT:
                       - Suitability for families with children
                       - Compatibility with other pets (dogs, cats, etc.)
                       - Experience level required (beginner/intermediate/experienced owner)

                    4. HEALTH & MEDICAL:
                       - Vaccination status and what's needed next
                       - Spay/neuter status and recommendations
                       - Any ongoing medical needs or conditions

                    5. LOGISTICS:
                       - Location-specific considerations (Pakistan climate, local vet availability)
                       - Adoption process guidance through Paltuu.pk
                       - Follow-up care and support available

                    ${petData.listing_type === "rescue" ? `
                    6. RESCUE-SPECIFIC GUIDANCE:
                       - Special care needs for rescued animals
                       - Behavioral considerations and patience required
                       - Rehabilitation and socialization tips
                       - Long-term commitment aspects
                    ` : ''}

                    TONE: Professional, informative, and encouraging. Focus on practical adoption advice rather than just repeating data.

                    If information is limited, provide general adoption guidance for this type of pet and mention: 
                    "Contact through Paltuu.pk for complete details and adoption process."
                    `;
                    break;

                case "sell":
                case "shop":
                    petSummaryPrompt = `
                    You are a chatbot for Paltuu.pk, a Pakistan-based pet platform. Generate a sales-focused description.

                    PET DATA:
                    ${JSON.stringify(petData)}

                    TASK: Create a compelling sales summary that highlights the pet's best qualities for potential buyers.

                    FOCUS ON:
                    1. PET QUALITIES:
                       - Breed characteristics and desirable traits
                       - Temperament and personality highlights
                       - Unique features or special qualities
                       - Health and genetic background

                    2. VALUE PROPOSITION:
                       - Why this pet is a good investment
                       - Comparison to similar pets in the market
                       - Any training or skills the pet has
                       - Pedigree or lineage information if available

                    3. CARE REQUIREMENTS:
                       - Basic care needs (feeding, grooming, exercise)
                       - Space and environment recommendations
                       - Ongoing maintenance costs

                    4. PURCHASE PROCESS:
                       - What's included in the price (vaccinations, papers, etc.)
                       - Health guarantee or warranty information
                       - Delivery or pickup options
                       - Payment terms and conditions

                    TONE: Professional, persuasive, and informative. Focus on the pet's value and qualities.

                    If information is limited, provide general information about this type of pet and mention:
                    "Contact the seller through Paltuu.pk for pricing and availability details."
                    `;
                    break;

                default:
                    petSummaryPrompt = `
                    You are a chatbot for Paltuu.pk, a Pakistan-based pet platform. Generate a general pet description.

                    PET DATA:
                    ${JSON.stringify(petData)}

                    TASK: Create a comprehensive description of this pet.

                    Include information about:
                    - Basic characteristics and appearance
                    - Care requirements and temperament
                    - Any special considerations
                    - Location and availability

                    TONE: Professional and informative.

                    If information is limited, provide general information and mention:
                    "Contact through Paltuu.pk for more details."
                    `;
            }

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(petSummaryPrompt);
            const text = await result.response.text();

            return NextResponse.json({
                success: true,
                data: text,
            });
        }

        // Original functionality for general prompts
        const userPrompt = prompt || "Ask me anything related to pets.";
        const combinedPrompt = `${systemPrompt} The user asks: "${userPrompt}"`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(combinedPrompt);
        const text = await result.response.text();
        

        return NextResponse.json({
            success: true,
            data: text,
        });
    } catch (error: any) {
        console.error("Error processing request:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }
}