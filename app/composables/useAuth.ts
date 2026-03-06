import type { AuthResponseDto, AuthTokensDto, AuthUserDto } from "~/types/auth";

const STORAGE_KEY = "simple-multi-chat-auth-v2";
const REFRESH_BUFFER_SECONDS = 30;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  expiresAt: number | null;
  user: AuthUserDto | null;
}

export const useAuth = () => {
  const { request } = useApi();

  const state = useState<AuthState>("auth-state", () => ({
    accessToken: null,
    refreshToken: null,
    tokenType: "Bearer",
    expiresAt: null,
    user: null
  }));

  const hydrated = useState<boolean>("auth-hydrated", () => false);
  const refreshInFlight = useState<Promise<boolean> | null>("auth-refresh-in-flight", () => null);

  const isAuthenticated = computed(() => {
    return Boolean(state.value.accessToken && state.value.user);
  });

  const persist = () => {
    if (!import.meta.client) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
  };

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) {
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        state.value = JSON.parse(stored) as AuthState;
      } catch {
        state.value = {
          accessToken: null,
          refreshToken: null,
          tokenType: "Bearer",
          expiresAt: null,
          user: null
        };
      }
    }

    hydrated.value = true;
  };

  const clearState = () => {
    state.value = {
      accessToken: null,
      refreshToken: null,
      tokenType: "Bearer",
      expiresAt: null,
      user: null
    };

    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const applyTokens = (tokens: AuthTokensDto) => {
    state.value.accessToken = tokens.access_token;
    state.value.refreshToken = tokens.refresh_token;
    state.value.tokenType = tokens.token_type;
    state.value.expiresAt = Date.now() + tokens.expires_in * 1000;
    persist();
  };

  const applyAuthResponse = (response: AuthResponseDto) => {
    applyTokens(response);
    state.value.user = response.user;
    persist();
  };

  const setUser = (user: AuthUserDto | null) => {
    state.value.user = user;
    persist();
  };

  const isAccessTokenExpired = () => {
    if (!state.value.accessToken || !state.value.expiresAt) {
      return true;
    }

    const expiresInSeconds = Math.floor((state.value.expiresAt - Date.now()) / 1000);

    return expiresInSeconds <= REFRESH_BUFFER_SECONDS;
  };

  const fetchMe = async () => {
    if (!state.value.accessToken) {
      return null;
    }

    const response = await request<{ user: AuthUserDto }>("/api/auth/me", {
      method: "GET",
      token: state.value.accessToken
    });

    setUser(response.user);

    return response.user;
  };

  const refresh = async () => {
    hydrate();

    if (!state.value.refreshToken) {
      clearState();
      return false;
    }

    if (refreshInFlight.value) {
      return refreshInFlight.value;
    }

    const pending = (async () => {
      try {
        const tokens = await request<AuthTokensDto>("/api/auth/refresh", {
          method: "POST",
          body: {
            refresh_token: state.value.refreshToken
          }
        });

        applyTokens(tokens);

        if (!state.value.user) {
          await fetchMe();
        }

        return true;
      } catch {
        clearState();
        return false;
      } finally {
        refreshInFlight.value = null;
      }
    })();

    refreshInFlight.value = pending;

    return pending;
  };

  const getAccessToken = async () => {
    hydrate();

    if (!state.value.accessToken || isAccessTokenExpired()) {
      const refreshed = await refresh();
      if (!refreshed) {
        return null;
      }
    }

    return state.value.accessToken;
  };

  const register = async (payload: {
    nickname: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) => {
    const response = await request<AuthResponseDto>("/api/auth/register", {
      method: "POST",
      body: {
        nickname: payload.nickname,
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.passwordConfirmation
      }
    });

    applyAuthResponse(response);

    return response;
  };

  const login = async (payload: { email: string; password: string }) => {
    const response = await request<AuthResponseDto>("/api/auth/login", {
      method: "POST",
      body: payload
    });

    applyAuthResponse(response);

    return response;
  };

  const forgotPassword = async (email: string) => {
    return await request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  };

  const resetPassword = async (payload: {
    email: string;
    token: string;
    password: string;
    passwordConfirmation: string;
  }) => {
    return await request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: {
        email: payload.email,
        token: payload.token,
        password: payload.password,
        password_confirmation: payload.passwordConfirmation
      }
    });
  };

  const logout = async () => {
    try {
      if (state.value.accessToken) {
        await request<{ message: string }>("/api/auth/logout", {
          method: "POST",
          token: state.value.accessToken
        });
      }
    } finally {
      clearState();
    }
  };

  return {
    state,
    hydrated,
    isAuthenticated,
    hydrate,
    fetchMe,
    getAccessToken,
    register,
    login,
    forgotPassword,
    resetPassword,
    refresh,
    logout,
    setUser
  };
};
