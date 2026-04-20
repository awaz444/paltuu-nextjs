import { NextResponse, NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserIdFromRequest } from "@/utils/authServer";

const apiKey = process.env.API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

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

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using a more stable model name
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return NextResponse.json({ success: true, data: text });

    } catch (error) {
        console.error("AI Summary error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
