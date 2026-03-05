import type { MessageWithSender } from "../entities/Message.js";

export interface MessageRepository {
  listByChat(chatId: string, limit: number): Promise<MessageWithSender[]>;
  create(chatId: string, senderId: string, content: string): Promise<MessageWithSender>;
}
