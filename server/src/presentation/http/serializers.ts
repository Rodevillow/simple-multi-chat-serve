import type { ChatPreview } from "../../domain/entities/Chat.js";
import type { MessageWithSender } from "../../domain/entities/Message.js";
import type { PublicUser } from "../../domain/entities/User.js";

export const serializeUser = (user: PublicUser) => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  firstName: user.firstName,
  lastName: user.lastName
});

export const serializeChatPreview = (chat: ChatPreview) => ({
  id: chat.id,
  participant: serializeUser(chat.participant),
  lastMessage: chat.lastMessage
    ? {
        id: chat.lastMessage.id,
        content: chat.lastMessage.content,
        senderId: chat.lastMessage.senderId,
        createdAt: chat.lastMessage.createdAt.toISOString()
      }
    : null
});

export const serializeMessage = (message: MessageWithSender) => ({
  id: message.id,
  chatId: message.chatId,
  senderId: message.senderId,
  content: message.content,
  createdAt: message.createdAt.toISOString(),
  sender: serializeUser(message.sender)
});
