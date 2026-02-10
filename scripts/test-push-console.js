// Copy and paste this into browser console to test push subscription manually
async function testPush() {
    console.log("Testing Push Subscription...");
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "YOUR_VAPID_KEY_HERE"; // You might need to hardcode if env not avail in console

    if (!('serviceWorker' in navigator)) {
        console.error("Service Worker not supported");
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    console.log("SW Registration:", registration);

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    console.log("Got Subscription:", subscription);

    // Send to backend
    const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
    });

    console.log("Backend response:", await res.json());
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
