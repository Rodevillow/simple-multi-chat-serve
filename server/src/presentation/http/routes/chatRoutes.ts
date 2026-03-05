import { Router } from "express";
import { z } from "zod";
import type { CreateDirectChatUseCase } from "../../../application/use-cases/CreateDirectChatUseCase.js";
import type { ListChatsUseCase } from "../../../application/use-cases/ListChatsUseCase.js";
import type { ListMessagesUseCase } from "../../../application/use-cases/ListMessagesUseCase.js";
import type { SendMessageUseCase } from "../../../application/use-cases/SendMessageUseCase.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { createAuthMiddleware, type AuthedRequest } from "../middleware/authMiddleware.js";
import { serializeChatPreview, serializeMessage } from "../serializers.js";
import type { TokenService } from "../../../domain/services/TokenService.js";

interface ChatRoutesDeps {
  tokenService: TokenService;
  listChatsUseCase: ListChatsUseCase;
  createDirectChatUseCase: CreateDirectChatUseCase;
  listMessagesUseCase: ListMessagesUseCase;
  sendMessageUseCase: SendMessageUseCase;
}

const createDirectChatSchema = z.object({
  email: z.string().email("Некорректный email")
});

const sendMessageSchema = z.object({
  content: z.string().min(1, "Сообщение не может быть пустым")
});

const zodErrorMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? "Ошибка валидации";
};

export const createChatRoutes = ({
  tokenService,
  listChatsUseCase,
  createDirectChatUseCase,
  listMessagesUseCase,
  sendMessageUseCase
}: ChatRoutesDeps) => {
  const router = Router();
  const auth = createAuthMiddleware(tokenService);

  router.use(auth);

  router.get("/", async (request: AuthedRequest, response, next) => {
    try {
      const userId = request.auth!.userId;
      const chats = await listChatsUseCase.execute(userId);
      response.json(chats.map(serializeChatPreview));
    } catch (error) {
      next(error);
    }
  });

  router.post("/direct", async (request: AuthedRequest, response, next) => {
    try {
      const body = createDirectChatSchema.parse(request.body);
      const preview = await createDirectChatUseCase.execute({
        currentUserId: request.auth!.userId,
        targetEmail: body.email
      });
      response.status(201).json(serializeChatPreview(preview));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(zodErrorMessage(error), 400, "VALIDATION_ERROR"));
      }
      return next(error);
    }
  });

  router.get("/:chatId/messages", async (request: AuthedRequest, response, next) => {
    try {
      const chatId = request.params.chatId;
      const limit = request.query.limit ? Number(request.query.limit) : undefined;

      const messages = await listMessagesUseCase.execute({
        userId: request.auth!.userId,
        chatId,
        limit
      });

      response.json(messages.map(serializeMessage));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:chatId/messages", async (request: AuthedRequest, response, next) => {
    try {
      const body = sendMessageSchema.parse(request.body);
      const message = await sendMessageUseCase.execute({
        userId: request.auth!.userId,
        chatId: request.params.chatId,
        content: body.content
      });

      response.status(201).json(serializeMessage(message));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(zodErrorMessage(error), 400, "VALIDATION_ERROR"));
      }
      return next(error);
    }
  });

  return router;
};
