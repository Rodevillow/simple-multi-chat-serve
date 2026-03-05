import { AppError } from "../../domain/errors/AppError.js";
import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { MessageRepository } from "../../domain/repositories/MessageRepository.js";

interface ListMessagesInput {
  userId: string;
  chatId: string;
  limit?: number;
}

export class ListMessagesUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository
  ) {}

  async execute(input: ListMessagesInput) {
    const isMember = await this.chatRepository.isMember(input.chatId, input.userId);
    if (!isMember) {
      throw new AppError("Доступ к чату запрещен", 403, "CHAT_FORBIDDEN");
    }

    const safeLimit = Math.max(1, Math.min(input.limit ?? 100, 200));
    return this.messageRepository.listByChat(input.chatId, safeLimit);
  }
}
