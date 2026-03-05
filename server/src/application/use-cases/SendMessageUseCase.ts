import { AppError } from "../../domain/errors/AppError.js";
import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { MessageRepository } from "../../domain/repositories/MessageRepository.js";
import type { MessageNotifier } from "../../domain/services/MessageNotifier.js";

interface SendMessageInput {
  userId: string;
  chatId: string;
  content: string;
}

export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly messageNotifier: MessageNotifier
  ) {}

  async execute(input: SendMessageInput) {
    const isMember = await this.chatRepository.isMember(input.chatId, input.userId);
    if (!isMember) {
      throw new AppError("Доступ к чату запрещен", 403, "CHAT_FORBIDDEN");
    }

    const content = input.content.trim();
    if (!content) {
      throw new AppError("Сообщение не может быть пустым", 400, "EMPTY_MESSAGE");
    }

    const message = await this.messageRepository.create(input.chatId, input.userId, content);
    await this.messageNotifier.broadcastMessage(message);

    return message;
  }
}
