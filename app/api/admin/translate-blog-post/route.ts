import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const TARGET_LOCALES = ["ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

async function fetchWithRetry(url: string, options: any, retries = 0): Promise<Response> {
  const MAX_RETRIES = 3;
  try {
    const res = await fetch(url, options);
    if (!res.ok && (res.status === 429 || res.status === 503 || res.status === 500) && retries < MAX_RETRIES) {
      console.warn(`Gemini API returned ${res.status}. Retrying in ${2 ** retries}s...`);
      await new Promise(r => setTimeout(r, (2 ** retries) * 1000));
      return fetchWithRetry(url, options, retries + 1);
    }
    return res;
  } catch (e) {
    if (retries < MAX_RETRIES) {
      console.warn(`Fetch failed: ${e}. Retrying in ${2 ** retries}s...`);
      await new Promise(r => setTimeout(r, (2 ** retries) * 1000));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw e;
  }
}

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
    const { title, excerpt, content, seo_title, meta_description, meta_keywords } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields (title, content)" }, { status: 400 });
    }

    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const apiKey = settings.gemini_api_key;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key is not configured in Site Settings." }, { status: 500 });
    }

    // Process locales sequentially to avoid Gemini Free Tier burst rate limits (15 RPM)
    const translations: Record<string, any> = {};
    for (const loc of TARGET_LOCALES) {
      const prompt = `
You are an expert localization specialist and marketing copywriter. 
Translate the following blog post content from English into ${loc}.
Maintain the exact HTML structure, styling, and tone. 
Return ONLY a valid JSON object in this exact format, with no markdown wrappers or additional text:
{
  "title": "Translated title",
  "content": "Translated HTML content",
  "seo_title": "Translated SEO title",
  "meta_description": "Translated meta description",
  "meta_keywords": ["translated", "keywords", "array"],
  "excerpt": "Translated excerpt"
}

Title to translate:
${title}

SEO Title to translate:
${seo_title || title}

Meta Description to translate:
${meta_description || ""}

Meta Keywords to translate:
${meta_keywords ? meta_keywords.join(", ") : ""}

Excerpt to translate:
${excerpt || ""}

Content to translate (HTML):
${content}
`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`;
      
      try {
        const response = await fetchWithRetry(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          console.error(`Failed to translate for ${loc}: ${await response.text()}`);
          continue; // Do not throw, just skip this language
        }

        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textOutput) {
          console.error(`No content from Gemini for ${loc}`);
          continue;
        }

        let parsed;
        try {
          parsed = JSON.parse(textOutput.trim());
        } catch (e) {
          console.error(`Invalid JSON from Gemini for ${loc}: ${textOutput}`);
          continue;
        }
        translations[loc] = parsed;
      } catch (err: any) {
        console.error(`Error translating ${loc}:`, err);
      }

      // Delay slightly to respect Gemini's 15 RPM free tier limit when translating 8 languages at once
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return NextResponse.json({ translations });

  } catch (err: any) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
