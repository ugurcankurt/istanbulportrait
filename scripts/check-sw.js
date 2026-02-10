// Check SW registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log("Found registrations:", registrations);
        if (registrations.length === 0) {
            console.warn("No service workers found! This explains why it hangs.");
        } else {
            registrations.forEach(r => console.log("SW Scope:", r.scope, "Active:", r.active));
        }
    });
}
