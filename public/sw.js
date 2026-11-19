// Minimal service worker so TwendeRun can be installed as an app.
// It deliberately caches nothing: every visit gets the latest version, and
// run data always comes live from the server.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
