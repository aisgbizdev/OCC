const CACHE_NAME = "occ-shell-v4";
const SHELL_ASSETS = [
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function shouldCache(url) {
  const u = new URL(url);
  if (u.pathname.startsWith("/api/")) return false;
  if (u.pathname.startsWith("/@")) return false;
  if (u.pathname.startsWith("/src/")) return false;
  if (u.pathname.startsWith("/node_modules/")) return false;
  // Never cache HTML or navigation requests — always fetch fresh so new JS hashes load correctly
  const lastSegment = u.pathname.split("/").pop() ?? "";
  const hasExt = lastSegment.includes(".");
  if (!hasExt) return false; // e.g. /login, /dashboard — these return HTML
  if (u.pathname.endsWith(".html")) return false;
  if (u.pathname.endsWith(".ts") || u.pathname.endsWith(".tsx") || u.pathname.endsWith(".js") || u.pathname.endsWith(".jsx") || u.pathname.endsWith(".css")) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  if (!shouldCache(request.url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(async () => {
        return new Response("OCC is offline. Please reconnect.", { status: 503, headers: { "Content-Type": "text/plain" } });
      });
    })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "OCC", body: event.data.text(), url: "/" };
  }

  const options = {
    body: payload.body ?? "",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: payload.tag ?? "occ-notification",
    data: { url: payload.url ?? "/" },
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title ?? "OCC", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.registration.scope));
      if (existing) {
        existing.focus();
        existing.postMessage({ type: "navigate", url: targetUrl });
      } else {
        self.clients.openWindow(self.registration.scope.replace(/\/$/, "") + targetUrl);
      }
    })
  );
});
