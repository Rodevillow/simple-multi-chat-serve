import type { ChatRepository } from "../../domain/repositories/ChatRepository.js";

export class ListChatsUseCase {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(userId: string) {
    return this.chatRepository.listPreviewsForUser(userId);
  }
}
