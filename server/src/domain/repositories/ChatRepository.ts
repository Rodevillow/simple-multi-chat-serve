import type { ChatPreview } from "../entities/Chat.js";
import type { PublicUser } from "../entities/User.js";

export interface ChatRepository {
  listPreviewsForUser(userId: string): Promise<ChatPreview[]>;
  findPreviewByIdForUser(chatId: string, userId: string): Promise<ChatPreview | null>;
  findDirectChatBetween(firstUserId: string, secondUserId: string): Promise<{ id: string } | null>;
  createDirectChat(firstUserId: string, secondUserId: string): Promise<{ id: string }>;
  isMember(chatId: string, userId: string): Promise<boolean>;
  listMembers(chatId: string): Promise<PublicUser[]>;
}
