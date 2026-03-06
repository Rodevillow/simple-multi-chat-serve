import type {
  AddContactResponse,
  ChatMessagesResponse,
  ChatUserSearchResponse,
  ChatUsersResponse,
  ChatsListResponse,
  CreateChatResponse,
  MarkReadResponse,
  SendMessageResponse
} from "~/types/chat";

export const useChatsApi = () => {
  const { request } = useApi();
  const auth = useAuth();

  const requireToken = async () => {
    const token = await auth.getAccessToken();

    if (!token) {
      throw new Error("Unauthorized");
    }

    return token;
  };

  const listChats = async (search = "") => {
    const token = await requireToken();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return await request<ChatsListResponse>(`/api/chats${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method: "GET",
      token,
      headers: {
        "Cache-Control": "no-cache"
      }
    });
  };

  const listUsers = async (search = "") => {
    const token = await requireToken();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return await request<ChatUsersResponse>(`/api/chats/users${params.size > 0 ? `?${params.toString()}` : ""}`, {
      method: "GET",
      token
    });
  };

  const searchUsers = async (search: string) => {
    const token = await requireToken();
    const params = new URLSearchParams();
    const query = search.trim();

    if (!query) {
      return { users: [] } satisfies ChatUserSearchResponse;
    }

    params.set("search", query);

    return await request<ChatUserSearchResponse>(`/api/chats/users/search?${params.toString()}`, {
      method: "GET",
      token
    });
  };

  const addContact = async (userId: string) => {
    const token = await requireToken();

    return await request<AddContactResponse>("/api/chats/contacts", {
      method: "POST",
      token,
      body: {
        user_id: Number(userId)
      }
    });
  };

  const createDirect = async (userId: string) => {
    const token = await requireToken();

    return await request<CreateChatResponse>("/api/chats/direct", {
      method: "POST",
      token,
      body: {
        user_id: Number(userId)
      }
    });
  };

  const createGroup = async (title: string, participantIds: string[]) => {
    const token = await requireToken();

    return await request<CreateChatResponse>("/api/chats/group", {
      method: "POST",
      token,
      body: {
        title: title.trim(),
        participant_ids: participantIds.map((id) => Number(id))
      }
    });
  };

  const listMessages = async (chatId: string, beforeId?: string | null, limit = 50) => {
    const token = await requireToken();
    const params = new URLSearchParams();

    params.set("limit", String(limit));
    if (beforeId) {
      params.set("before_id", beforeId);
    }

    return await request<ChatMessagesResponse>(`/api/chats/${chatId}/messages?${params.toString()}`, {
      method: "GET",
      token
    });
  };

  const sendMessage = async (chatId: string, body: string) => {
    const token = await requireToken();

    return await request<SendMessageResponse>(`/api/chats/${chatId}/messages`, {
      method: "POST",
      token,
      body: {
        body: body.trim()
      }
    });
  };

  const markRead = async (chatId: string, messageId?: string) => {
    const token = await requireToken();

    return await request<MarkReadResponse>(`/api/chats/${chatId}/read`, {
      method: "POST",
      token,
      body: messageId
        ? {
            message_id: Number(messageId)
          }
        : {}
    });
  };

  return {
    listChats,
    listUsers,
    searchUsers,
    addContact,
    createDirect,
    createGroup,
    listMessages,
    sendMessage,
    markRead
  };
};
