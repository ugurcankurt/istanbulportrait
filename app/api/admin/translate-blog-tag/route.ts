import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing required 'name'" }, { status: 400 });
    }

    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const apiKey = settings.gemini_api_key;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured in Site Settings." }, { status: 500 });
    }

    const prompt = `
You are a professional localization expert. Your task is to translate the following English blog tag into the following languages: ${TARGET_LOCALES.join(", ")}.

English Source Tag:
Name: ${name}

Respond ONLY with a valid minified JSON object mapping each locale code to the translated object. Ensure the JSON format matches exactly this structure:
{
  "tr": {
    "name": "..."
  },
  "ar": { ... }
}

Provide accurate, professional, and concise translations suitable for a high-end photography blog tag.
`;

    // Connect to Google Gemini REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error:", errorData);
      return NextResponse.json({ error: "Failed to communicate with AI" }, { status: 500 });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json({ error: "Invalid AI response structure" }, { status: 500 });
    }

    let parsedTranslations = {};
    try {
      parsedTranslations = JSON.parse(textOutput);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textOutput);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ translations: parsedTranslations });

  } catch (err: any) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
