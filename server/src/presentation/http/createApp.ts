import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../domain/errors/AppError.js";
import type { TokenService } from "../../domain/services/TokenService.js";
import { config } from "../../infrastructure/config/env.js";
import type { CreateDirectChatUseCase } from "../../application/use-cases/CreateDirectChatUseCase.js";
import type { ListChatsUseCase } from "../../application/use-cases/ListChatsUseCase.js";
import type { ListMessagesUseCase } from "../../application/use-cases/ListMessagesUseCase.js";
import type { SendMessageUseCase } from "../../application/use-cases/SendMessageUseCase.js";
import type { LoginUserUseCase } from "../../application/use-cases/LoginUserUseCase.js";
import type { RegisterUserUseCase } from "../../application/use-cases/RegisterUserUseCase.js";
import { createAuthRoutes } from "./routes/authRoutes.js";
import { createChatRoutes } from "./routes/chatRoutes.js";

interface CreateAppDeps {
  tokenService: TokenService;
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  listChatsUseCase: ListChatsUseCase;
  createDirectChatUseCase: CreateDirectChatUseCase;
  listMessagesUseCase: ListMessagesUseCase;
  sendMessageUseCase: SendMessageUseCase;
}

export const createApp = (deps: CreateAppDeps) => {
  const app = express();
  const allowedOrigins = config.clientOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (config.nodeEnv !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      timestamp: new Date().toISOString()
    });
  });

  app.use(
    "/api/auth",
    createAuthRoutes({
      registerUserUseCase: deps.registerUserUseCase,
      loginUserUseCase: deps.loginUserUseCase
    })
  );

  app.use(
    "/api/chats",
    createChatRoutes({
      tokenService: deps.tokenService,
      listChatsUseCase: deps.listChatsUseCase,
      createDirectChatUseCase: deps.createDirectChatUseCase,
      listMessagesUseCase: deps.listMessagesUseCase,
      sendMessageUseCase: deps.sendMessageUseCase
    })
  );

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const httpError = error as Error & {
      status?: number;
      statusCode?: number;
      type?: string;
      code?: string;
    };

    if (error instanceof AppError) {
      return response.status(error.statusCode).json({
        message: error.message,
        code: error.code
      });
    }

    const status = httpError.statusCode ?? httpError.status;
    if (status === 413 || httpError.type === "entity.too.large") {
      return response.status(413).json({
        message: "Слишком большой размер запроса",
        code: "PAYLOAD_TOO_LARGE"
      });
    }

    if (status && status >= 400 && status < 500) {
      return response.status(status).json({
        message: httpError.message || "Ошибка запроса",
        code: httpError.code || "REQUEST_ERROR"
      });
    }

    return response.status(500).json({
      message: httpError.message ?? "Неизвестная ошибка",
      code: "INTERNAL_ERROR"
    });
  });

  return app;
};
