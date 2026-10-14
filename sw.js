// Service worker: a helper that runs in the background of the browser.
// Its job here: keep a copy of the app files so the app opens with no network.

const CACHE = "nouillesapp-v2";
const FILES = ["./", "index.html", "style.css", "app.js", "config.js", "sprites.js", "manifest.json"];

// When installed: save the app files into the cache
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

// When activated: delete old caches from earlier versions
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

// For every request: try the network first (so updates show up right away),
// and if there is no network, use the saved copy.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Never cache Supabase calls: the app handles its own offline copy of the list.
  if (e.request.url.includes("supabase.co")) return;

  // For our own files, always ask GitHub "did this change?" before using the browser's
  // own 10-minute cache. Otherwise a phone can show an old icon or old page for a while.
  const own = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(
    fetch(e.request, own ? { cache: "no-cache" } : undefined)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
