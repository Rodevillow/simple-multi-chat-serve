import type { PublicUser } from "./User.js";

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface MessageWithSender extends Message {
  sender: PublicUser;
}
