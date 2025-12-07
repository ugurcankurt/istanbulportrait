const FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v18.0";
const INSTAGRAM_ACCOUNT_ID = "17841405940949698"; // Istanbul Portrait Instagram ID

export async function sendInstagramMessage(recipientId: string, text: string) {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
        console.error("Missing INSTAGRAM_ACCESS_TOKEN");
        return;
    }

    try {
        // Target the specific Instagram Account ID instead of /me/messages (which defaults to Page)
        const response = await fetch(`${FACEBOOK_GRAPH_URL}/${INSTAGRAM_ACCOUNT_ID}/messages?access_token=${accessToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text: text }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Failed to send Instagram message:", JSON.stringify(errorData, null, 2));
            throw new Error(`Instagram API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error sending Instagram message:", error);
        throw error;
    }
}
