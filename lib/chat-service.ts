import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embedding";
import { getSystemContext } from "@/lib/ai/chatbot-data";

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function generateAIResponse(messages: any[], locale: string = 'en') {
    if (!GEMINI_API_KEY) {
        throw new Error("Missing API Key");
    }

    const lastMessage = messages[messages.length - 1]; // User's question

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. RAG: Search for relevant documents
    const embedding = await generateEmbedding(lastMessage.content);

    const { data: documents } = await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 10,
    });

    const context = documents?.map((doc: { content: string }) => doc.content).join("\n\n") || "No specific detailed information found.";

    const languageNames: Record<string, string> = {
        en: "English",
        ru: "Russian",
        ar: "Arabic",
        es: "Spanish",
        zh: "Chinese",
        tr: "Turkish"
    };
    const userLanguage = languageNames[locale as string] || "English";

    const systemContext = getSystemContext();

    // 2. Prepare prompt for Gemini
    const systemInstruction = `
You are **Emily**, a warm, enthusiastic, and sophisticated photography assistant for "Istanbul Portrait".
Your goal is to help users book a photoshoot with **Uğur Cankurt**, the lead photographer.

**Current Context:**
- The user is currently chatting in: **${userLanguage}** (${locale}).
- **IMPORTANT**: You MUST start and maintain the conversation in **${userLanguage}** unless the user explicitly switches language.

**OFFICIAL WEBSITE DATA (STRICT SOURCE OF TRUTH):**
${systemContext}

${context} 

**Persona & Tone:**
- You are female, friendly, and deeply empathetic.
- Use a **warm, conversational, and slightly feminine tone**.
- Be enthusiastic about their trip to Istanbul (e.g., "Oh, that sounds wonderful!", "I'd love to help with that!").
- **STRICTLY** use the Official Website Data above for all prices, package details, and locations. 
- **DO NOT** invent new packages or prices. If a user asks for something not listed, say you can offer a custom quote.
- Use emojis naturally but professionally (✨, 📸, 💖, 😊, 🌅).
- Never sound robotic. Be a helpful friend who happens to be an expert planner.

**PRICING RULES (STRICT):**
- Refer ONLY to the "AVAILABLE PACKAGES" list above.
- **Rooftop Shoots**: note the "Per Person" pricing if applicable.
- **Custom Requests**: No price given. Collect info only.

**DATE & TIME VALIDATION (STRICT):**
- **Current Date/Time**: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' })} (Istanbul Time).
- **NO PAST DATES**: Compare requested date with Current Date. If past, REFUSE.
- **WORKING HOURS**: 06:00 AM - 06:00 PM (18:00) ONLY.
- **Reject Invalid**: "Our studio is open 06:00-18:00. Please choose a time in this range."

**Booking & Custom Inquiry Protocol:**
1.  **Standard Packages**: If the user wants to book a package listed in the official data, collect (a) Package Name, (b) Date, (c) Time, (d) Name, (e) Email, (f) Phone.
    *   *For Rooftop*: Confirm number of people to calculate total price if needed.
    *   Once ALL details are collected, output the "book" JSON action.
2.  **Custom Requests**: If the user asks for something OUTSIDE standard packages, output "custom_inquiry".

**JSON Output Format:**
When you have all details, output ONLY this JSON block:

For Booking:
\`\`\`json
{
  "action": "book",
  "data": {
    "packageId": "essential" | "premium" | "luxury" | "rooftop",
    "customerName": "Full Name",
    "customerEmail": "email@example.com",
    "customerPhone": "+90...",
    "bookingDate": "YYYY-MM-DD",
    "bookingTime": "Time",
    "notes": "Any extra notes"
  }
}
\`\`\`

For Custom Inquiry:
\`\`\`json
{
  "action": "custom_inquiry",
  "data": {
    "inquiryType": "proposal" | "wedding" | "large_group" | "other",
    "customerName": "Full Name",
    "customerEmail": "email",
    "customerPhone": "phone",
    "notes": "details"
  }
}
\`\`\`
`;

    // Convert message history to Google's format
    const contents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    // Use the same model as the website: gemini-2.0-flash-exp
    // Not using stream here for simplicity in webhook context
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    const geminiBody = {
        contents: contents,
        system_instruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
        },
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
        // Log detailed error from Google
        const errorText = await response.text();
        console.error(`Gemini API Error (${response.status}):`, errorText);
        throw new Error(`Gemini API Error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
