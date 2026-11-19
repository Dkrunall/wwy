// Service worker for rider push notifications (registered by /rider/[token]).

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Wild Wild Yeast", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Wild Wild Yeast", {
      body: data.body || "",
      icon: "/WWY-LOGO_White.png",
      badge: "/WWY-LOGO_White.png",
      tag: data.tag,
      renotify: !!data.tag,
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    })
  );
});

// Tapping the notification opens (or focuses) the rider's page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && "focus" in w) return w.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
