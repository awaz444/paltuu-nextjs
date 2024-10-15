import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.API_KEY as string;
// const genAI = new GoogleGenerativeAI(apiKey);

// const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-flash",
//   systemInstruction: "You are a chatbot that only provides answers related to pets (animal care, breeds, adoption, health)",
// });

const systemPrompt = `You are a chatbot that only provides answers related to pets (animal care, breeds, adoption, health)`;

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json();
        const userPrompt = body.prompt || "Ask me anything related to fashion.";

        const combinedPrompt = `${systemPrompt} The user asks: "${userPrompt}"`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
