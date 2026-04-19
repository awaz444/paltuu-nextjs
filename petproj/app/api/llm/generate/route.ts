/**
 * @swagger
 * /api/llm/generate:
 *   post:
 *     summary: Auto-generated summary for /api/llm/generate
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const { productName } = body || {};

    if (!productName) {
      return NextResponse.json(
        { error: "Missing product name" },
        { status: 400 }
      );
    }

    const apiKey = process.env.BAZAAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key on server. Set BAZAAR_API_KEY in environment." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are a product description generator for pet products. Generate clear, factual Markdown descriptions.

      
STRUCTURE:
- Product Title (H1)
- **Description** (2-3 paragraphs about benefits and features)
- **Ingredients** (if applicable)
- **Nutritional Information** (if applicable)

Keep it concise and factual.`,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: process.env.LLM_MAX_TOKENS ? Number(process.env.LLM_MAX_TOKENS) : 2048,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const prompt = `Generate a product description for: ${productName}`;
    const TIMEOUT_MS = process.env.LLM_TIMEOUT_MS ? Number(process.env.LLM_TIMEOUT_MS) : 25000;

    const generateAndRead = async () => {
      const result = await model.generateContent(prompt);

      // Check for blocks
      if (result.response.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${result.response.promptFeedback.blockReason}`);
      }

      const candidate = result.response.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        throw new Error('Content blocked by safety filters');
      }

      if (candidate?.finishReason === 'MAX_TOKENS') {
        console.warn('[LLM] Hit max tokens limit - increase LLM_MAX_TOKENS env var');
      }

      const text = await result.response.text();
      if (!text?.trim()) {
        throw new Error(`Empty response. FinishReason: ${candidate?.finishReason || 'unknown'}`);
      }

      return text.trim();
    };

    let text: string;
    try {
      text = await Promise.race([
        generateAndRead(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('LLM_TIMEOUT')), TIMEOUT_MS)
        )
      ]);
    } catch (e: any) {
      const isTimeout = String(e?.message).includes('LLM_TIMEOUT');
      return NextResponse.json({
        error: isTimeout ? 'LLM request timed out' : 'Failed to generate description',
        message: e?.message,
        durationMs: Date.now() - start
      }, { status: isTimeout ? 504 : 500 });
    }

    return NextResponse.json({ text, durationMs: Date.now() - start }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Failed to generate description",
        message: e?.message,
        durationMs: Date.now() - start,
      },
      { status: 500 }
    );
  }
}
