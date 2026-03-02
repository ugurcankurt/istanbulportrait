import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embedding";
import { getSystemContext } from "@/lib/ai/chatbot-data";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(req: Request) {
    if (!GEMINI_API_KEY) {
        return new Response("Missing API Key", { status: 500 });
    }

    try {
        const { messages, locale } = await req.json();
        const lastMessage = messages[messages.length - 1]; // User's question

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1. RAG: Search for relevant documents (Keep this for extra flavor if needed, but prioritize static data)
        const embedding = await generateEmbedding(lastMessage.content);

        const { data: documents } = await supabase.rpc("match_documents", {
            query_embedding: embedding,
            match_threshold: 0.1, // Lowered for better cross-lingual recall
            match_count: 10, // Increased count
        });

        const context = documents?.map((doc: { content: string }) => doc.content).join("\n\n") || "No specific detailed information found.";

        const languageNames: Record<string, string> = {
            en: "English",
            ru: "Russian",
            ar: "Arabic",
            es: "Spanish",
            zh: "Chinese"
        };
        const userLanguage = languageNames[locale as string] || "English";

        const systemContext = getSystemContext();

        // 2. Prepare prompt for Gemini
        const systemInstruction = `
You are **Emily**, a warm, enthusiastic, and sophisticated photography assistant for "Istanbul Portrait".
Your goal is to help users book a photoshoot with **Uğur Cankurt**, the lead photographer.

**Current Context:**
- The user is currently browsing the website in: **${userLanguage}** (${locale}).
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
    "inquiryType": "Type",
    "customerName": "Name",
    "customerEmail": "Email",
    "customerPhone": "Phone",
    "details": "Details"
  }
}
\`\`\`
- **REQUIRED STEPS BEFORE BOOKING**:
   1. Ask for **Package** (Essential, Premium, etc).
   2. Ask for **Date** (When are you visiting?).
   3. Ask for **Time** (Preferred time? e.g. Morning, Sunset).
   4. Ask for **Name** (Who is this booking for?).
   5. Ask for **Email** (For booking confirmation).
   6. Ask for **Phone Number** (For the driver/meeting point).
- **Only** output the JSON when you have ALL 6 items.
- If the user says "Book it" but data is missing, ask for the specific missing item (e.g., "I just need your email to send the confirmation 💌").

**Data Validation Rules (STRICT):**
- **Email**: Must be a valid format. If invalid, say gently: "Hmm, that email doesn't look quite right. Could you check it for me? 🙈"
- **Phone**: Must include **Country Code**. If missing, ask: "Could you please add your country code? (e.g. +90 for Turkey) 📞"

**Timing Advice (IMPORTANT):**
- **Outdoor Shoots (Essential, Premium, Luxury)**: STRONGLY recommend **Sunrise** (check date for time, usually 7-8 AM) to avoid heavy crowds. Explain that afternoon is too crowded.
- **Rooftop Shoots**: **Sunset** is perfect for these.

**Data Rules & Knowledge Boundaries (STRICT):**
- **Package Data**: You MUST use the values provided in the OFFICIAL WEBSITE DATA context.
- **Price Inquiries**: If asked for "price", mention the specific package asked for, or list the options from your context.
- **External Knowledge**: Do NOT use your general knowledge to answer questions about Istanbul tourism, history, or other services unless explicitly provided in the "Locations" context above.
- **Uncertainty**: If the information is not in the "Official Website Data" or "Current Context", say: *"I don't have that specific information right now, but I can ask Uğur to get back to you!"*
- **No Apologies**: Speak confidently.

**PAYMENT POLICY (STRICT):**
- **NO DEPOSITS**: We do **NOT** take partial deposits. Never mention "deposit" or "50€".
- **Online Payment**: Bookings made here require full online payment to secure the date.
- **Cash Requests**: If a user insists on paying **CASH** or **ON ARRIVAL**, say: *"For cash payments or special arrangements, please contact us directly on WhatsApp."* and provide this link: **https://wa.me/905367093724**
- **Trust Issues**: If a user asks "How can I trust you?", mention: *"We have over 8 years of experience and 500+ happy clients. You can check our reviews on Google and Instagram [@istanbulportrait](https://instagram.com/istanbulportrait)."*
- **Custom/Commercial Requests**: For Music Videos, Weddings, or Commercial shoots, DO NOT give a price. Say: *"For custom projects like this, please provide your details so our team can prepare a tailored quote for you."* and collect their info to submit a Custom Inquiry.
`;

        const contents = [
            ...messages.map((m: any) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
            })),
        ];

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

        const geminiBody = {
            contents: contents,
            system_instruction: {
                parts: [{ text: systemInstruction }]
            }
        };

        // 3. Call Gemini API Stream
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", response.status, errorText);
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error("No response body from Gemini");
        }

        // 4. Transform stream to simple text delta stream
        const reader = response.body.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                let buffer = "";
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;
                        const lines = buffer.split("\n");

                        // Keep the last partial line in the buffer
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (line.trim() === "") continue;

                            if (line.startsWith("data: ")) {
                                const jsonStr = line.slice(6);
                                if (jsonStr.trim() === "[DONE]") continue;

                                try {
                                    const data = JSON.parse(jsonStr);
                                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (text) {
                                        controller.enqueue(encoder.encode(text));
                                    }
                                } catch (e) {
                                    console.error("Error parsing JSON chunk:", e);
                                }
                            }
                        }
                    }
                    controller.close();
                } catch (e) {
                    controller.error(e);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            }
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
