// Fallback Service Worker
// This file is a placeholder to prevent 404 errors during development if next-pwa fails to generate one.
// It will be overwritten by next-pwa in production or if build succeeds.

self.addEventListener('install', (event) => {
    console.log('Fallback SW installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Fallback SW activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Istanbul Portrait';
    const options = {
        body: data.body || '',
        icon: '/icon1.webp',
        badge: '/icon1.webp',
        data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        return clientList[i].focus();
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
