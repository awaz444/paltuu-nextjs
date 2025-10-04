import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName } = body || {};

    if (!productName) {
      return NextResponse.json(
        { error: "Missing product name" },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.BAZAAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing API key on server. Set BAZAAR_API_KEY in environment.",
        },
        { status: 400 }
      );
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are a factual product-content generator for pet products. Generate a comprehensive Markdown product description based on the product name provided.

REQUIREMENTS:
1. Search the web for accurate information about the specific product when possible
2. Create detailed descriptions (3-4 paragraphs) covering benefits, features, and usage
3. Use proper Markdown formatting with **bold headings** for each section
4. Include accurate nutritional information when available
5. Display nutritional information in a clean, readable format without tables
6. Keep content factual and avoid exaggerated marketing claims

STRUCTURE (use **bold** for all section headings):
- Product Title (H1 with #)
- **Description** (2-3 detailed paragraphs about the product, its benefits, target pets, and key features)
- **Ingredients** (bullet list if available, note allergens in parentheses)
- **Nutritional Information** (formatted as clean list with serving size note)

NUTRITIONAL INFORMATION FORMAT:
Display nutritional values like this:
**Nutritional Analysis (per 100g):**
- **Protein:** 24g
- **Fat:** 12g
- **Carbohydrates:** 32g
- **Fiber:** 3g
- **Calcium:** 1.5%
- **Phosphorus:** 1%

*Serving size: 1 cup (100g)*

FORMATTING RULES:
- Use # for main title, **text** for section headings
- Use bullet points with bold nutrient names for nutritional info
- Always include serving size note in italics
- Keep nutritional values accurate to real product data when possible
- Include allergen information where relevant
- Make descriptions comprehensive and informative (not just 2-3 sentences)`,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    });

    // Generate description from product name
    const prompt = `Generate a comprehensive product description for: ${productName}. Please include detailed information about ingredients, nutritional content, benefits for pets, and usage instructions. Format with proper markdown headings using **bold** for section headers.`;
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return NextResponse.json({ text: text.trim() }, { status: 200 });
  } catch (e: any) {
    console.error("LLM proxy error", e);
    return NextResponse.json(
      {
        error: "Failed to generate description",
        message: e?.message,
      },
      { status: 500 }
    );
  }
}
