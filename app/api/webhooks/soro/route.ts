import { NextResponse } from "next/server";
import { createBlogPost } from "@/lib/blog/blog-service";
import { settingsService } from "@/lib/settings-service";

const TARGET_LOCALES = ["ar", "ru", "es", "zh", "de", "fr", "ro", "tr"];

async function translateTo(
  locale: string,
  englishPost: { title: string; excerpt: string; content: string },
  apiKey: string,
) {
  const prompt = `
You are an expert localization specialist and marketing copywriter. 
Translate the following English blog post into the language with locale code: ${locale}.

English Source:
Title: ${englishPost.title}
Excerpt: ${englishPost.excerpt || ""}

Content (Markdown Format):
${englishPost.content}

CRITICAL RULES:
1. Retain all Markdown formatting exactly as it is (headers like ##, bold like **, lists, links, image tags). Only translate the readable text.
2. Ensure the tone is professional, engaging, and suitable for a high-end photography blog.
3. Provide a valid minified JSON object with the translation.

Format matching exactly this JSON schema, return ONLY JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}
`;

  const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;
  const response = await fetch(groqUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a JSON translation API. Return ONLY valid JSON, with no backticks, no markdown blocks, and no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API Error for ${locale}: ${await response.text()}`);
  }

  const data = await response.json();
  const textOutput = data.choices?.[0]?.message?.content;
  if (!textOutput) throw new Error(`Invalid AI response for ${locale}`);

  const parsed = JSON.parse(textOutput.trim());
  return {
    locale,
    title: parsed.title || "",
    excerpt: parsed.excerpt || "",
    content: parsed.content || "",
    slug: parsed.title
      ? parsed.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : "",
  };
}

// Soro Webhook Handler
// Accept incoming posts from Soro SEO and save to database
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const secret = process.env.SORO_WEBHOOK_SECRET;

    if (!secret) {
      console.warn(
        "SORO_WEBHOOK_SECRET is not defined in environment variables.",
      );
    } else if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid Secret Token" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // The base English object received from Soro
    const enBase = {
      title: body.title || "",
      slug:
        body.slug ||
        (body.title
          ? body.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
          : ""),
      excerpt: body.excerpt || "",
      content: body.content || "",
    };

    const translations: Record<string, any> = {
      en: enBase,
    };

    // Auto-Translate parallel logic
    const settings = await settingsService.getSettings();
    const apiKey = process.env.GROQ_API_KEY || settings.gemini_api_key;

    if (apiKey && enBase.title && enBase.content) {
      try {
        console.log("Starting parallel Groq translations for:", TARGET_LOCALES);
        const results = await Promise.all(
          TARGET_LOCALES.map((loc) => translateTo(loc, enBase, apiKey)),
        );
        results.forEach((res) => {
          translations[res.locale] = {
            title: res.title,
            excerpt: res.excerpt,
            content: res.content,
            slug: res.slug,
          };
        });
        console.log("Successfully completed parallel translations!");
      } catch (transErr) {
        console.error("Auto-translation failed during webhook:", transErr);
        // We catch the error so we can still save the English post even if translation fails
      }
    } else {
      console.warn(
        "No Groq API key found (in process.env.GROQ_API_KEY or settings.gemini_api_key) or missing English content. Skipping auto-translations.",
      );
    }

    // Map payload to our Next.js Database schema
    const postData = {
      status: body.status || "draft",
      featured_image: body.featured_image || null,
      published_at:
        body.status === "published" || body.published_at
          ? new Date().toISOString()
          : null,
      is_featured: false,
      category_ids: body.category_ids || [],
      tag_ids: body.tag_ids || [],
      translations: translations,
    };

    const post = await createBlogPost(postData as any);

    return NextResponse.json({
      success: true,
      translatedLocales: Object.keys(translations),
      post,
    });
  } catch (error: any) {
    console.error("Soro Webhook Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
