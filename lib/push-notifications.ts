export async function registerServiceWorkerAndSubscribe(publicVapidKey: string) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return null;
    }

    // Check current permission state
    if (Notification.permission === "denied") {
        return null;
    }

    try {
        // Check if any registration exists
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
            try {
                await navigator.serviceWorker.register("/sw.js");
            } catch (regError) {
                console.error("Service worker registration failed:", regError);
            }
        }

        let registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });
        }

        // Send subscription to backend
        await saveSubscription(subscription);

        return subscription;
    } catch (error) {
        console.error("Failed to subscribe to push notifications:", error);
        throw error;
    }
}

async function saveSubscription(subscription: PushSubscription) {
    try {
        const response = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(subscription),
        });

        if (!response.ok) {
            throw new Error("Failed to save subscription on server");
        }
    } catch (error) {
        console.error("Error saving subscription:", error);
    }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
