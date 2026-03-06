export default defineNuxtPlugin(async () => {
  const auth = useAuth();
  auth.hydrate();

  if (!auth.state.value.accessToken) {
    return;
  }

  try {
    const token = await auth.getAccessToken();
    if (!token) {
      return;
    }

    await auth.fetchMe();
  } catch {
    await auth.logout();
  }
});
