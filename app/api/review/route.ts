import { NextResponse } from "next/server";

type ReviewMode = "review" | "explain" | "fix";
type Provider = "openrouter" | "groq";

type ReviewPayload = {
  code?: string;
  language?: string;
  mode?: ReviewMode;
  provider?: Provider;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_CODE_LENGTH = 5000;

const buildSystemPrompt = (language: string, mode: ReviewMode): string => {
  if (mode === "review") {
    return `You are a senior code reviewer. Analyze the ${language} code. Return ONLY valid JSON: {\"issues\": [\"issue1\"], \"suggestions\": [\"suggestion1\"], \"security\": [\"security1\"]}. No other text.`;
  }

  if (mode === "explain") {
    return `Explain the ${language} code below line by line in simple English. Return plain text with line breaks.`;
  }

  return `Fix bugs in the ${language} code below. Return ONLY the corrected code, no explanation, no markdown.`;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewPayload;
    const code = body.code?.trim();
    const language = body.language?.trim() || "code";
    const mode = body.mode;
    const provider = body.provider ?? "openrouter";

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

    if (!["openrouter", "groq"].includes(provider)) {
      return NextResponse.json(
        { error: "Provider must be one of: openrouter, groq." },
        { status: 400 },
      );
    }

    const apiKey =
      provider === "groq"
        ? process.env.GROQ_API_KEY
        : process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            provider === "groq"
              ? "Missing GROQ_API_KEY in environment variables."
              : "Missing OPENROUTER_API_KEY in environment variables.",
        },
        { status: 500 },
      );
    }

    const model =
      provider === "groq"
        ? process.env.GROQ_MODEL || "openai/gpt-oss-120b"
        : process.env.OPENROUTER_MODEL || "qwen/qwen3-36b-plus";

    const response = await fetch(
      provider === "groq" ? GROQ_URL : OPENROUTER_URL,
      {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(provider === "openrouter"
          ? { "HTTP-Referer": "http://localhost:3000" }
          : {}),
      },
      body: JSON.stringify({
        model,
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
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `${provider === "groq" ? "Groq" : "OpenRouter"} request failed: ${errorText || response.statusText}`,
        },
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
