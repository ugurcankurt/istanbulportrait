import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      duration,
      features,
      meta_description,
      meta_keywords,
      targetLocale,
    } = body;

    if (
      !title ||
      !description ||
      !features ||
      !duration ||
      !meta_description ||
      !meta_keywords ||
      !targetLocale
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is not configured." },
        { status: 500 },
      );
    }

    const prompt = `
You are a professional localization expert. Your task is to translate the following English photography package details into the following language code: ${targetLocale}.

English Source:
Title: ${title}
Duration: ${duration}
Description: ${description}
Meta Description (SEO snippet max 160 chars): ${meta_description}
Meta Keywords (SEO):
${meta_keywords.map((k: string) => `- ${k}`).join("\n")}
Features:
${features.map((f: string) => `- ${f}`).join("\n")}

Respond ONLY with a valid minified JSON object mapping the locale code to the translated object. Ensure the JSON format matches exactly this structure (do not include any reasoning or <think> tags in your final output, ONLY the JSON):
{
  "${targetLocale}": {
    "title": "...",
    "duration": "...",
    "description": "...",
    "meta_description": "...",
    "meta_keywords": ["...", "..."],
    "features": ["...", "..."]
  }
}

Provide accurate, professional, marketing-friendly translations suitable for a high-end photography business in Istanbul.
`;

    // Connect to NVIDIA NIM API (DeepSeek)
    const nvidiaUrl = `https://integrate.api.nvidia.com/v1/chat/completions`;

    const response = await fetch(nvidiaUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/deepseek-r1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DeepSeek API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to communicate with AI" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const textOutput = data.choices?.[0]?.message?.content;

    if (!textOutput) {
      return NextResponse.json(
        { error: "Invalid AI response structure" },
        { status: 500 },
      );
    }

    let parsedTranslations = {};
    try {
      // Robust JSON extraction to handle DeepSeek <think> blocks
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      const cleanJsonStr = jsonMatch ? jsonMatch[0] : textOutput;
      parsedTranslations = JSON.parse(
        cleanJsonStr.replace(/```(?:json)?/gi, "").trim(),
      );
    } catch (e) {
      console.error("Failed to parse JSON:", textOutput);
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 500 },
      );
    }

    return NextResponse.json({ translations: parsedTranslations });
  } catch (err: any) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

