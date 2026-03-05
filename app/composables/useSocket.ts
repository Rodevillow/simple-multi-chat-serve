import { io, type Socket } from "socket.io-client";

export const useSocket = () => {
  const config = useRuntimeConfig();
  const socketState = useState<Socket | null>("socket-instance", () => null);

  const connect = (token: string) => {
    if (!import.meta.client) {
      return null;
    }

    if (socketState.value?.connected) {
      return socketState.value;
    }

    socketState.value = io(config.public.apiBase, {
      transports: ["websocket"],
      auth: {
        token
      }
    });

    return socketState.value;
  };

  const disconnect = () => {
    socketState.value?.disconnect();
    socketState.value = null;
  };

  return {
    socket: socketState,
    connect,
    disconnect
  };
};
