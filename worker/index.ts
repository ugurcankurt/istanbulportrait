/// <reference lib="webworker" />

// Cast self to ServiceWorkerGlobalScope to avoid conflicts with lib.dom.d.ts
const scope = self as unknown as ServiceWorkerGlobalScope;

interface PushPayload {
    title?: string;
    body?: string;
    url?: string;
}

scope.addEventListener("push", (event) => {
    const pushEvent = event as PushEvent;
    const data = pushEvent.data?.json() as PushPayload | undefined;

    const title = data?.title || "Istanbul Portrait";
    const options: NotificationOptions = {
        body: data?.body || "",
        icon: "/icon1.webp",
        badge: "/icon1.webp",
        data: {
            url: data?.url || "/",
        },
    };

    pushEvent.waitUntil(scope.registration.showNotification(title, options));
});

scope.addEventListener("notificationclick", (event) => {
    const notificationEvent = event as NotificationEvent;

    notificationEvent.notification.close();
    notificationEvent.waitUntil(
        scope.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                // Check if any client is focused
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                        return client.focus();
                    }
                }
                return client.focus();
            }
            return scope.clients.openWindow(notificationEvent.notification.data.url);
        })
    );
});

// Install event - force waiting to activate immediately
scope.addEventListener("install", (event) => {
    // @ts-ignore
    scope.skipWaiting();
});

// Activate event - claim clients immediately
scope.addEventListener("activate", (event) => {
    // @ts-ignore
    event.waitUntil(scope.clients.claim());
});
