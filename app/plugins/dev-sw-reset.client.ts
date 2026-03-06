export default defineNuxtPlugin(async () => {
  if (!import.meta.client || !import.meta.dev) {
    return;
  }

  if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    return;
  }

  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async (registration) => registration.unregister()));
    } catch {
      // no-op: best effort for local dev
    }
  }

  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(async (name) => caches.delete(name)));
    } catch {
      // no-op: best effort for local dev
    }
  }
});
