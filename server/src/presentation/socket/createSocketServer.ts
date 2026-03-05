import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { TokenService } from "../../domain/services/TokenService.js";

interface CreateSocketServerDeps {
  tokenService: TokenService;
  chatRepository: ChatRepository;
}

export const createSocketServer = (httpServer: HttpServer, deps: CreateSocketServerDeps) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      return next(new Error("Missing auth token"));
    }

    try {
      const payload = deps.tokenService.verify(token);
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      return next();
    } catch {
      return next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("chat:join", async (payload: { chatId?: string }) => {
      if (!payload?.chatId) {
        return;
      }

      const isMember = await deps.chatRepository.isMember(payload.chatId, userId);
      if (!isMember) {
        socket.emit("chat:error", { message: "Нет доступа к этому чату" });
        return;
      }

      socket.join(`chat:${payload.chatId}`);
    });

    socket.on("chat:leave", (payload: { chatId?: string }) => {
      if (!payload?.chatId) {
        return;
      }

      socket.leave(`chat:${payload.chatId}`);
    });
  });

  return io;
};
