const FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v18.0";

export async function sendInstagramMessage(recipientId: string, text: string) {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID;

    if (!accessToken) {
        console.error("Missing INSTAGRAM_ACCESS_TOKEN");
        return;
    }

    if (!instagramAccountId) {
        console.error("Missing INSTAGRAM_ACCOUNT_ID in environment variables");
        return;
    }

    try {
        // Target the specific Instagram Account ID instead of /me/messages (which defaults to Page)
        const response = await fetch(`${FACEBOOK_GRAPH_URL}/${instagramAccountId}/messages?access_token=${accessToken}`, {
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

            // Helpful error handling for common mistakes
            if (errorData.error?.code === 3) {
                console.error(">>> PERMISSION ERROR: This app does not have the 'instagram_manage_messages' permission or the token is invalid.");
            }

            throw new Error(`Instagram API Error: ${response.statusText} - ${errorData.error?.message || "Unknown error"}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error sending Instagram message:", error);
        throw error;
    }
}
