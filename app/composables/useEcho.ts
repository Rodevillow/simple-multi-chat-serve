type EchoPrivateChannel = {
  listen: (event: string, callback: (payload: any) => void) => EchoPrivateChannel;
};

type EchoPresenceChannel = {
  here: (callback: (members: any[]) => void) => EchoPresenceChannel;
  joining: (callback: (member: any) => void) => EchoPresenceChannel;
  leaving: (callback: (member: any) => void) => EchoPresenceChannel;
};

type EchoInstance = {
  private: (channel: string) => EchoPrivateChannel;
  join: (channel: string) => EchoPresenceChannel;
  leave: (channel: string) => void;
  disconnect: () => void;
  connector?: {
    pusher?: {
      connection?: {
        bind?: (event: string, callback: (...args: any[]) => void) => void;
      };
    };
  };
};

type EchoRealtimeStatus = "idle" | "connected" | "unavailable";

export const useEcho = () => {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const echoState = useState<EchoInstance | null>("echo-instance", () => null);
  const realtimeStatus = useState<EchoRealtimeStatus>("echo-realtime-status", () => "idle");
  const realtimeProbeAt = useState<number>("echo-realtime-probe-at", () => 0);

  const resolveHost = () => {
    if (!import.meta.client) {
      return String(config.public.reverb.host ?? "127.0.0.1");
    }

    const configured = String(config.public.reverb.host ?? "").trim();
    if (!configured || configured === "0.0.0.0") {
      return window.location.hostname;
    }

    return configured;
  };

  const resolveHttpScheme = () => (config.public.reverb.scheme === "https" ? "https" : "http");

  const isRealtimeReachable = async (force = false) => {
    if (!import.meta.client) {
      return false;
    }

    const now = Date.now();
    if (!force && now - realtimeProbeAt.value < 10_000) {
      return realtimeStatus.value !== "unavailable";
    }

    const host = resolveHost();
    const scheme = resolveHttpScheme();
    const port = Number(config.public.reverb.port);
    const probeUrl = `${scheme}://${host}:${port}/`;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);

    try {
      await fetch(probeUrl, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal
      });

      realtimeStatus.value = "idle";
      realtimeProbeAt.value = now;

      return true;
    } catch {
      realtimeStatus.value = "unavailable";
      realtimeProbeAt.value = now;

      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const connect = async () => {
    if (!import.meta.client) {
      return null;
    }

    if (echoState.value) {
      return echoState.value;
    }

    const token = await auth.getAccessToken();
    if (!token || !config.public.reverb.appKey) {
      return null;
    }

    const reachable = await isRealtimeReachable();
    if (!reachable) {
      return null;
    }

    const [{ default: Echo }, { default: Pusher }] = await Promise.all([import("laravel-echo"), import("pusher-js")]);
    (globalThis as { Pusher?: unknown }).Pusher = Pusher;

    const wsHost = resolveHost();
    const wsPort = Number(config.public.reverb.port);
    const forceTls = config.public.reverb.scheme === "https";

    const instance = new Echo({
      broadcaster: "reverb",
      key: config.public.reverb.appKey,
      wsHost,
      wsPort,
      wssPort: wsPort,
      forceTLS: forceTls,
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${config.public.apiBase}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    }) as EchoInstance;

    const markUnavailable = () => {
      realtimeStatus.value = "unavailable";

      if (echoState.value === instance) {
        instance.disconnect();
        echoState.value = null;
      }
    };

    instance.connector?.pusher?.connection?.bind?.("connected", () => {
      realtimeStatus.value = "connected";
    });
    instance.connector?.pusher?.connection?.bind?.("error", markUnavailable);
    instance.connector?.pusher?.connection?.bind?.("unavailable", markUnavailable);
    instance.connector?.pusher?.connection?.bind?.("disconnected", markUnavailable);

    echoState.value = instance;

    return instance;
  };

  const disconnect = () => {
    echoState.value?.disconnect();
    echoState.value = null;
    if (realtimeStatus.value === "connected") {
      realtimeStatus.value = "idle";
    }
  };

  const reconnect = async () => {
    disconnect();
    return await connect();
  };

  return {
    echo: echoState,
    realtimeStatus,
    connect,
    disconnect,
    reconnect,
    isRealtimeReachable
  };
};
