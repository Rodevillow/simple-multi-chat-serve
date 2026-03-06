export interface ChatMemberDto {
  id: string;
  nickname: string;
  email: string;
  avatar_url: string | null;
}

export interface ChatMessageDto {
  id: string;
  chat_id: string;
  kind: string;
  body: string | null;
  meta: Record<string, unknown> | null;
  created_at: string | null;
  sender: ChatMemberDto;
  is_mine: boolean;
}

export interface ChatSummaryDto {
  id: string;
  type: "direct" | "group";
  title: string;
  subtitle: string;
  avatar_url: string | null;
  participants: ChatMemberDto[];
  participants_count: number;
  unread_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
  my_role: string | null;
  my_last_read_message_id: string | null;
  direct_target: ChatMemberDto | null;
  last_message: ChatMessageDto | null;
}

export interface ChatsListResponse {
  chats: ChatSummaryDto[];
}

export interface ChatUsersResponse {
  users: ChatMemberDto[];
}

export interface ChatUserSearchResultDto extends ChatMemberDto {
  is_contact: boolean;
}

export interface ChatUserSearchResponse {
  users: ChatUserSearchResultDto[];
}

export interface AddContactResponse {
  contact: ChatMemberDto;
  created: boolean;
}

export interface CreateChatResponse {
  chat: ChatSummaryDto;
  created: boolean;
}

export interface ChatMessagesResponse {
  messages: ChatMessageDto[];
  next_before_id: string | null;
  has_more: boolean;
}

export interface SendMessageResponse {
  message: ChatMessageDto;
  chat: ChatSummaryDto;
}

export interface MarkReadResponse {
  message: string;
  last_read_message_id: string | null;
}

export interface ChatCreatedBroadcastPayload {
  chat: ChatSummaryDto;
}

export interface ChatMessageBroadcastPayload {
  chat_id: string;
  message: ChatMessageDto;
}

export interface ChatMessageNotificationBroadcastPayload {
  chat: ChatSummaryDto;
  message: ChatMessageDto;
  unread_count: number;
}

export interface ChatReadUpdatedBroadcastPayload {
  chat_id: string;
  user_id: string;
  last_read_message_id: string | null;
}
