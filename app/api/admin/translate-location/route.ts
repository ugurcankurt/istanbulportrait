import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TARGET_LOCALES = ["ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

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

    const { title, description, best_time, photography_tips } =
      await req.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API Key is not configured in Site Settings." },
        { status: 500 },
      );
    }

    const prompt = `
You are a professional localization expert. Your task is to translate the following English photography location details into the following languages: ${TARGET_LOCALES.join(", ")}.

English Source:
Title: ${title}
Description: ${description}
Best Time To Visit: ${best_time || "Not specified"}
Photography Tips:
${photography_tips ? photography_tips.map((tip: string) => `- ${tip}`).join("\n") : "None"}

Respond ONLY with a valid minified JSON object mapping each locale code to the translated object. Ensure the JSON format matches exactly this structure:
{
  "tr": {
    "title": "...",
    "description": "...",
    "best_time": "...",
    "photography_tips": ["...", "..."]
  },
  "ar": { ... },
  "ru": { ... }
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
        model: "deepseek-ai/deepseek-v4-flash-0731",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
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
      parsedTranslations = JSON.parse(
        textOutput.replace(/```(?:json)?/gi, "").trim(),
      );
    } catch (e) {
      console.error("Failed to parse Groq JSON:", textOutput);
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 500 },
      );
    }

    return NextResponse.json({ translatedSegments: parsedTranslations });
  } catch (err: any) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
