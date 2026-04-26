import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";

// Define a stable cache time for identical search intents (e.g. 30 days)
export const revalidate = 2592000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing required query string" }, { status: 400 });
    }

    // 1. Get settings for Gemini API Key
    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const apiKey = settings.gemini_api_key;
    
    if (!apiKey) {
      console.warn("Gemini API Key is not configured for intent resolution.");
      return NextResponse.json({ slug: null });
    }

    // 2. Fetch active packages to provide context to the AI
    const activePackages = await packagesService.getActivePackages();
    if (!activePackages || activePackages.length === 0) {
      return NextResponse.json({ slug: null });
    }

    // Format packages context: slug, english name, and english description
    const packagesContext = activePackages.map(pkg => {
      const name = pkg.title["en"] || pkg.slug;
      const desc = pkg.description["en"] || "";
      return `- Slug: "${pkg.slug}" | Name: "${name}" | Description: "${desc.substring(0, 150)}..."`;
    }).join("\n");

    // 3. Build the prompt
    const prompt = `
You are an intelligent e-commerce personalization assistant for a photography website in Istanbul.
Your task is to map a user's search intent/query to the most appropriate photography package from our available catalog.

Available Packages:
${packagesContext}

User's Search Query: "${query}"

Instructions:
1. Analyze the semantic meaning of the user's search query (it might be in Turkish, English, Arabic, Russian, etc.).
2. Determine which of the available packages is the BEST match for this query.
3. If the query is entirely unrelated to photography or none of the packages are a good match, return null.
4. Respond ONLY with a minified JSON object containing the chosen slug. Do NOT include markdown code blocks or any other text.

Expected JSON format:
{"slug": "the-chosen-slug"}
OR
{"slug": null}
`;

    // 4. Connect to Google Gemini REST API (gemini-2.5-flash)
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
          temperature: 0.1, // Keep it highly deterministic
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini Intent API Error:", await response.text());
      return NextResponse.json({ slug: null });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json({ slug: null });
    }

    let parsedResult = { slug: null };
    try {
      parsedResult = JSON.parse(textOutput);
    } catch (e) {
      console.error("Failed to parse Gemini JSON for intent:", textOutput);
    }

    // Double check that the returned slug actually exists in our DB
    const validSlug = activePackages.some(p => p.slug === parsedResult.slug) ? parsedResult.slug : null;

    return NextResponse.json({ slug: validSlug });

  } catch (err: any) {
    console.error("Intent resolution error:", err);
    return NextResponse.json({ slug: null }, { status: 500 });
  }
}
