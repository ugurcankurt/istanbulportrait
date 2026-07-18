import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    const { topic } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Missing required topic parameter" }, { status: 400 });
    }

    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const apiKey = settings.gemini_api_key;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured in Site Settings." }, { status: 500 });
    }

    let trendingKeywordsStr = "";
    try {
      const googleTrends = require("google-trends-api");
      
      const [usTrendsResult, gbTrendsResult] = await Promise.all([
        googleTrends.relatedQueries({ keyword: 'istanbul', geo: 'US' }).catch(() => null),
        googleTrends.relatedQueries({ keyword: 'istanbul', geo: 'GB' }).catch(() => null)
      ]);

      let allTrends: string[] = [];

      const processTrends = (resultStr: string | null) => {
        if (!resultStr) return;
        try {
          const trendsData = JSON.parse(resultStr);
          const topTrends = trendsData?.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 3)?.map((k: any) => k.query) || [];
          const risingTrends = trendsData?.default?.rankedList?.[1]?.rankedKeyword?.slice(0, 3)?.map((k: any) => k.query) || [];
          allTrends.push(...topTrends, ...risingTrends);
        } catch (e) {}
      };

      processTrends(usTrendsResult);
      processTrends(gbTrendsResult);

      allTrends = [...new Set(allTrends)].filter(Boolean);
      
      if (allTrends.length > 0) {
        trendingKeywordsStr = `\nGOOGLE TRENDS INTEGRATION: As of today, the following keywords are trending in the USA and UK on Google regarding Istanbul: "${allTrends.join(", ")}". You MUST organically weave these exact keywords into your blog content to maximize SEO impact, without making it look forced. If a keyword is a local Turkish phrase, treat it as local color.\n`;
      }
    } catch (trendErr) {
      console.warn("Failed to fetch Google Trends data:", trendErr);
    }

    const prompt = `
You are a highly experienced professional photographer who has been shooting in Istanbul for 10 years, as well as an expert SEO Content Marketer. 
Write a high-quality, 100% unique, and engaging blog post about: "${topic}".
The target audience is international tourists visiting Istanbul interested in viewing or booking our photography packages (solo portraits, couples, proposals, weddings, family shoots).

CRITICAL SEO & TONE INSTRUCTIONS:
- The content MUST be 100% unique and original. Do not write generic or duplicate content that can be found elsewhere on Google. Provide fresh, valuable, and highly SEO-optimized insights based on your 10 years of local street experience.
- Use simple, accessible, and warm language that any tourist from anywhere in the world can easily understand. Avoid overly complex jargon.
- Write from a welcoming, experienced, and deeply helpful perspective.${trendingKeywordsStr}

Content Guidelines:
1. Title: Catchy, highly SEO-optimized, clear.
2. Excerpt: A brief, engaging summary of the post (1-2 sentences).
3. Content: 
   - Write deeply informative, engaging content covering the topic thoroughly.
   - Use proper Markdown headings (##, ###), bullet points, and formatting to make it highly readable and scannable.
   - Weave in subtle natural mentions about hiring professional photographers in Istanbul to capture memories.
   - Include practical and insider tips for tourists (timing, lighting, avoiding crowds, hidden spots).
   - Aim for a word count of roughly 500-1000 words.

Return ONLY a minified JSON object matching this exact structure, with no markdown code blocks wrapping the json:
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}
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
          temperature: 0.7,
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error (Generate Blog):", errorData);
      return NextResponse.json({ error: "Failed to communicate with AI for generation" }, { status: 500 });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json({ error: "Invalid AI response structure" }, { status: 500 });
    }

    let parsedBlogContent = {};
    try {
      parsedBlogContent = JSON.parse(textOutput);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textOutput);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return NextResponse.json({ post: parsedBlogContent });

  } catch (err: any) {
    console.error("Blog generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
