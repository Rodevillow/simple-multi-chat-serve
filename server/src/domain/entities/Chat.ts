import type { PublicUser } from "./User.js";

export interface Chat {
  id: string;
  isDirect: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatPreview {
  id: string;
  participant: PublicUser;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
}
