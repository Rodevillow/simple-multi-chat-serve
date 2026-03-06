import { AppError } from "../../domain/errors/AppError.js";
import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";

interface CreateDirectChatInput {
  currentUserId: string;
  targetEmail: string;
}

export class CreateDirectChatUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly chatRepository: ChatRepository
  ) {}

  async execute(input: CreateDirectChatInput) {
    const targetUser = await this.userRepository.findByEmail(input.targetEmail.trim().toLowerCase());
    if (!targetUser) {
      throw new AppError("Пользователь с таким email не найден", 404, "USER_NOT_FOUND");
    }

    if (targetUser.id === input.currentUserId) {
      throw new AppError("Нельзя создать чат с самим собой", 400, "SELF_CHAT_FORBIDDEN");
    }

    const existing = await this.chatRepository.findDirectChatBetween(input.currentUserId, targetUser.id);
    if (existing) {
      const existingPreview = await this.chatRepository.findPreviewByIdForUser(existing.id, input.currentUserId);
      if (!existingPreview) {
        throw new AppError("Чат уже существует, но недоступен", 409, "CHAT_ACCESS_ERROR");
      }
      return existingPreview;
    }

    const created = await this.chatRepository.createDirectChat(input.currentUserId, targetUser.id);
    const preview = await this.chatRepository.findPreviewByIdForUser(created.id, input.currentUserId);

    if (!preview) {
      throw new AppError("Не удалось получить созданный чат", 500, "CHAT_CREATE_FAILED");
    }

    return preview;
  }
}
