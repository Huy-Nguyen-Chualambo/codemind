import { NextResponse } from "next/server";

type ReviewMode = "review" | "explain" | "fix";

type ReviewPayload = {
  code?: string;
  language?: string;
  mode?: ReviewMode;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_CODE_LENGTH = 5000;

const buildSystemPrompt = (language: string, mode: ReviewMode): string => {
  if (mode === "review") {
    return `You are a senior code reviewer. Analyze the ${language} code. Return ONLY valid JSON: {\"issues\": [\"issue1\"], \"suggestions\": [\"suggestion1\"], \"security\": [\"security1\"]}. No other text.`;
  }

  if (mode === "explain") {
    return `Explain the ${language} code below line by line in simple Vietnamese. Return plain text with line breaks.`;
  }

  return `Fix bugs in the ${language} code below. Return ONLY the corrected code, no explanation, no markdown.`;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewPayload;
    const code = body.code?.trim();
    const language = body.language?.trim() || "code";
    const mode = body.mode;

    if (!code) {
      return NextResponse.json({ error: "Code is required." }, { status: 400 });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { error: `Code must be ${MAX_CODE_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    if (!mode || !["review", "explain", "fix"].includes(mode)) {
      return NextResponse.json(
        { error: "Mode must be one of: review, explain, fix." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY in environment variables." },
        { status: 500 },
      );
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(language, mode),
          },
          {
            role: "user",
            content: code,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenRouter request failed: ${errorText || response.statusText}` },
        { status: 500 },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const aiResponseText = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ result: aiResponseText });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while processing your request." },
      { status: 500 },
    );
  }
}
