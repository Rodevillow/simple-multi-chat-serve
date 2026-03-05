const PUBLIC_ROUTES = new Set(["/", "/login", "/register", "/forgot-password", "/reset-password"]);
const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return;
  }

  const auth = useAuth();
  auth.hydrate();

  if (PUBLIC_ROUTES.has(to.path)) {
    if (AUTH_ROUTES.has(to.path) && auth.isAuthenticated.value) {
      return navigateTo("/overview");
    }

    return;
  }

  const token = await auth.getAccessToken();

  if (!token) {
    return navigateTo("/login");
  }

  if (!auth.state.value.user) {
    try {
      await auth.fetchMe();
    } catch {
      await auth.logout();
      return navigateTo("/login");
    }
  }
});
