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

    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const apiKey = settings.gemini_api_key;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured in settings." },
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

Respond ONLY with a valid minified JSON object mapping the locale code to the translated object. Ensure the JSON format matches exactly this structure:
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

    // Connect to Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to communicate with AI" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json(
        { error: "Invalid AI response structure" },
        { status: 500 },
      );
    }

    let parsedTranslations = {};
    try {
      // Robust JSON extraction
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

