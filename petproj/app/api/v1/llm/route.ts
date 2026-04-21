import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.API_KEY as string;
// const apiKey = process.env.GOOGLE_GEMINI_API_KEY as string;
const modelName = process.env.GOOGLE_GEMINI_MODEL || "gemini-1.5-flash";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * @swagger
 * /api/v1/llm:
 *   post:
 *     summary: LLM Chat Endpoint (V1) - Pet Chatbot
 *     tags: [v1 LLM]
 */

async function generateWithRetry(model: any, content: any[], maxRetries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(content);
            return result.response.text();
        } catch (error: any) {
            if (error.status === 503 && attempt < maxRetries) {
                // Service Unavailable - wait and retry
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(`Model busy (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Max retries exceeded");
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt || !prompt.trim()) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const systemPrompt = `You are a helpful pet assistant for Paltuu.pk, Pakistan's leading pet platform.
You provide expert advice on:
- Pet care and health
- Breed characteristics
- Training tips
- Nutrition guidance
- Common pet problems and solutions

Be friendly, informative, and professional. Always recommend consulting a veterinarian for serious health issues.`;

        const model = genAI.getGenerativeModel({ model: modelName });

        const text = await generateWithRetry(model, [
            { text: systemPrompt },
            { text: prompt }
        ]);

        return NextResponse.json({ success: true, response: text });
    } catch (error) {
        console.error("LLM Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
