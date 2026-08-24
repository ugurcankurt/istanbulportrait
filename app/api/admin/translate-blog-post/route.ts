import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TARGET_LOCALES = ["ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

async function fetchWithRetry(
  url: string,
  options: any,
  retries = 0,
): Promise<Response> {
  const MAX_RETRIES = 3;
  try {
    const res = await fetch(url, options);
    if (
      !res.ok &&
      (res.status === 429 || res.status === 503 || res.status === 500) &&
      retries < MAX_RETRIES
    ) {
      let delaySeconds = 2 ** retries;
      try {
        const resClone = res.clone();
        const errorData = await resClone.json();
        const retryDelayStr = errorData?.error?.details?.find(
          (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
        )?.retryDelay;
        if (retryDelayStr) {
          const parsedDelay = Number.parseInt(
            retryDelayStr.replace("s", ""),
            10,
          );
          if (!Number.isNaN(parsedDelay)) {
            delaySeconds = parsedDelay + 2; // add 2s buffer
          }
        }
      } catch (e) {
        // ignore
      }

      console.warn(
        `Gemini API returned ${res.status}. Retrying in ${delaySeconds}s...`,
      );
      await new Promise((r) => setTimeout(r, delaySeconds * 1000));
      return fetchWithRetry(url, options, retries + 1);
    }
    return res;
  } catch (e) {
    if (retries < MAX_RETRIES) {
      console.warn(`Fetch failed: ${e}. Retrying in ${2 ** retries}s...`);
      await new Promise((r) => setTimeout(r, 2 ** retries * 1000));
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
      excerpt,
      content,
      seo_title,
      meta_description,
      meta_keywords,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields (title, content)" },
        { status: 400 },
      );
    }

    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const apiKey = settings.gemini_api_key;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is not configured in Site Settings." },
        { status: 500 },
      );
    }

    // We can run these in parallel now since we use NVIDIA NIM, which doesn't have the strict 15RPM limit
    const translations: Record<string, any> = {};
    const chunkSize = 2;
    const chunkPromises = [];

    for (let i = 0; i < TARGET_LOCALES.length; i += chunkSize) {
      const chunkLocales = TARGET_LOCALES.slice(i, i + chunkSize);

      const prompt = `
You are an expert localization specialist and marketing copywriter. 
Translate the following blog post content from English into the following languages: ${chunkLocales.join(", ")}.
Maintain the exact HTML structure, styling, and tone for each language. 
Return ONLY a valid minified JSON object where keys are the locale codes and values are the translated objects. Do not include markdown wrappers or additional text.
Example format:
{
  "${chunkLocales[0]}": {
    "title": "Translated title",
    "content": "Translated HTML content",
    "seo_title": "Translated SEO title",
    "meta_description": "Translated meta description",
    "meta_keywords": ["translated", "keywords", "array"],
    "excerpt": "Translated excerpt"
  }
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

      // Add the promise to our parallel array
      chunkPromises.push(
        (async () => {
          const url = `https://integrate.api.nvidia.com/v1/chat/completions`;
          try {
            const response = await fetchWithRetry(url, {
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
              console.error(
                `Failed to translate for ${chunkLocales.join(", ")}: ${await response.text()}`,
              );
              return;
            }

            const data = await response.json();
            const textOutput = data.choices?.[0]?.message?.content;

            if (!textOutput) {
              console.error(
                `No content from DeepSeek for ${chunkLocales.join(", ")}`,
              );
              return;
            }

            let parsed;
            try {
              parsed = JSON.parse(textOutput.trim());
            } catch (e) {
              console.error(
                `Invalid JSON from DeepSeek for ${chunkLocales.join(", ")}: ${textOutput}`,
              );
              return;
            }

            // Assign chunk results back to the main translations object
            for (const loc of chunkLocales) {
              if (parsed[loc]) {
                translations[loc] = parsed[loc];
              }
            }
          } catch (err: any) {
            console.error(`Error translating ${chunkLocales.join(", ")}:`, err);
          }
        })(),
      );
    }

    // Wait for all chunks to translate in parallel
    await Promise.all(chunkPromises);

    return NextResponse.json({ translations });
  } catch (err: any) {
    console.error("Translation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
