import { describe, expect, it } from "vitest";
import { SendMessageUseCase } from "../../src/application/use-cases/SendMessageUseCase.js";
import { AppError } from "../../src/domain/errors/AppError.js";
import type { ChatRepository } from "../../src/domain/repositories/ChatRepository.js";
import type { MessageRepository } from "../../src/domain/repositories/MessageRepository.js";
import type { MessageNotifier } from "../../src/domain/services/MessageNotifier.js";

const chatRepository: ChatRepository = {
  listPreviewsForUser: async () => [],
  findPreviewByIdForUser: async () => null,
  findDirectChatBetween: async () => null,
  createDirectChat: async () => ({ id: "chat" }),
  isMember: async () => true,
  listMembers: async () => []
};

const messageRepository: MessageRepository = {
  listByChat: async () => [],
  create: async () => ({
    id: "m1",
    chatId: "chat",
    senderId: "u1",
    content: "hi",
    createdAt: new Date(),
    sender: {
      id: "u1",
      email: "u1@example.com",
      nickname: null,
      firstName: null,
      lastName: null
    }
  })
};

const notifier: MessageNotifier = {
  broadcastMessage: async () => {
    return;
  }
};

describe("SendMessageUseCase", () => {
  it("throws error on empty message", async () => {
    const useCase = new SendMessageUseCase(chatRepository, messageRepository, notifier);

    await expect(
      useCase.execute({
        userId: "u1",
        chatId: "chat",
        content: "   "
      })
    ).rejects.toMatchObject<AppError>({
      code: "EMPTY_MESSAGE",
      statusCode: 400
    });
  });
});
