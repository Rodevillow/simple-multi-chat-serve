export interface UserDto {
  id: string;
  email: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface AuthPayload {
  token: string;
  user: UserDto;
}

export interface ChatPreviewDto {
  id: string;
  participant: UserDto;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
}

export interface MessageDto {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: UserDto;
}
