import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY as string;
const modelName = process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * @swagger
 * /api/v1/llm/generate:
 *   post:
 *     summary: Generate product description using AI
 *     tags: [v1 LLM]
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt || !prompt.trim()) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert product description writer for Paltuu.pk bazaar.
Generate engaging, accurate, and informative product descriptions that:
- Highlight key features and benefits
- Use compelling language
- Include relevant product specifications
- Are SEO-friendly
- Appeal to pet owners and buyers

Keep descriptions concise but detailed.`;

        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent([
            { text: systemPrompt },
            { text: prompt }
        ]);

        const text = result.response.text();

        return NextResponse.json({ success: true, description: text });
    } catch (error) {
        console.error("LLM Generate Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
