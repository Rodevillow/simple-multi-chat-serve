interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown> | FormData;
  token?: string | null;
  headers?: Record<string, string>;
}

export const useApi = () => {
  const config = useRuntimeConfig();

  const request = async <T>(path: string, options: RequestOptions = {}) => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {})
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    return await $fetch<T>(`${config.public.apiBase}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body
    });
  };

  return { request };
};
