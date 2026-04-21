import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserIdFromRequest } from "@/utils/authServer";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY as string;
const modelName = process.env.GOOGLE_GEMINI_MODEL || "gemini-1.5-flash";
const genAI = new GoogleGenerativeAI(apiKey);

async function generateWithRetry(model: any, content: any, maxRetries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(content);
            return result.response.text();
        } catch (error: any) {
            if (error.status === 503 && attempt < maxRetries) {
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

/**
 * @swagger
 * /api/v1/ai/summary:
 *   post:
 *     summary: Generate an AI summary for a pet listing (V1)
 *     tags: [v1 AI]
 */

export async function POST(req: NextRequest) {
    try {
        // 1. Secure access to registered users only
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized. Please login to use AI features." }, { status: 401 });

        const body = await req.json();
        const { petData } = body;

        if (!petData) return NextResponse.json({ error: "Missing pet data" }, { status: 400 });

        const prompt = `
            You are an AI assistant for Paltuu.pk, Pakistan's leading pet platform.
            Generate a professional, engaging summary for the following pet listing:
            ${JSON.stringify(petData)}

            Focus on:
            - Key personality traits
            - Care requirements
            - Suitability for families
            - Why this pet is special

            Keep the tone professional and encouraging.
        `;

        const model = genAI.getGenerativeModel({ model: modelName });
        const text = await generateWithRetry(model, prompt);

        return NextResponse.json({ success: true, data: text });

    } catch (error) {
        console.error("AI Summary error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
