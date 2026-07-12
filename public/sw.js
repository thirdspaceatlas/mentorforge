/* MentorForge service worker — handles web push notifications. */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "MentorForge", body: event.data.text() };
  }

  const title = payload.title || "MentorForge";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "mentorforge-nudge",
    data: { url: payload.url || "/app" },
    // Reliable-nudge (Phase 3) offers the user a choice: take the suggested
    // micro-dose, or open their own materials. Both deep-link into the app.
    actions: Array.isArray(payload.actions)
      ? payload.actions.slice(0, 2).map((a) => ({ action: a.action, title: a.title }))
      : undefined,
    renotify: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  // Both actions (and a plain body click) open the day view; the chosen action
  // is passed through as a query hint so the app can pre-select the flow.
  let targetUrl = data.url || "/app";
  if (event.action === "micro-dose" || event.action === "open-materials") {
    const sep = targetUrl.includes("?") ? "&" : "?";
    targetUrl = `${targetUrl}${sep}nudge=${event.action}`;
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });
      // Focus an existing tab if the user already has the app open.
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }
            return;
          }
        } catch {
          // fall through to openWindow
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
