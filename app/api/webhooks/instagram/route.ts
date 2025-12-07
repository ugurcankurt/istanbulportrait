import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/chat-service";
import { sendInstagramMessage } from "@/lib/instagram";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode && token) {
        if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }
    return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Checks if this is an event from a page subscription
        // Instagram events usually come under 'instagram' object, 
        // but if linked to a FB page, sometimes 'page'.
        // We check for 'instagram' primarily as per Graph API docs for Instagram Messaging.
        if (body.object === "instagram" || body.object === "page") {

            // Iterates over each entry - there may be multiple if batched
            for (const entry of body.entry) {
                // Gets the body of the webhook event
                if (entry.messaging) {
                    const webhook_event = entry.messaging[0];

                    const sender_psid = webhook_event.sender.id;

                    if (webhook_event.message && webhook_event.message.text) {
                        const received_text = webhook_event.message.text;

                        console.log(`Received message from ${sender_psid}: ${received_text}`);

                        // Generate AI Response
                        // We construct a simple message history with just the current message
                        // In a production app, you'd fetch previous conversation context here.
                        const messages = [{ role: 'user', content: received_text }];

                        try {
                            const aiResponseText = await generateAIResponse(messages, 'en');

                            // Clean up JSON blocks if AI outputted structured data (like 'book' action)
                            // For Instagram, we might want to strip that and just give a polite text, 
                            // or handle it. For now, let's strip the JSON block to show just text.
                            let cleanText = aiResponseText;
                            if (cleanText.includes("```json")) {
                                cleanText = cleanText.split("```json")[0].trim();
                                // We could technically parse the JSON and do something (like send a link),
                                // but for MVP, just showing the text part is safer.
                                if (!cleanText) {
                                    // If AI only outputted JSON (e.g. booking action), provide a fallback text
                                    cleanText = "Great! I have noted your details. We will send you a confirmation shortly.";
                                }
                            }

                            await sendInstagramMessage(sender_psid, cleanText);
                        } catch (aiError) {
                            console.error("AI Generation Error:", aiError);
                            // Optional: Send fallback message to user?
                        }
                    }
                }
            }

            // Returns a '200 OK' response to all requests
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
        } else {
            return new NextResponse("Not Found", { status: 404 });
        }

    } catch (error) {
        console.error("Webhook POST Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
