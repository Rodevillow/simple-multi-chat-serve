<script setup lang="ts">
import Avatar from "primevue/avatar";
import Badge from "primevue/badge";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Divider from "primevue/divider";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Popover from "primevue/popover";
import Skeleton from "primevue/skeleton";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";
import type {
  ChatCreatedBroadcastPayload,
  ChatMemberDto,
  ChatMessageBroadcastPayload,
  ChatMessageDto,
  ChatMessageNotificationBroadcastPayload,
  ChatReadUpdatedBroadcastPayload,
  ChatUserSearchResultDto,
  ChatSummaryDto
} from "~/types/chat";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

type ChatMode = "chat" | "call";
type CreateMode = "direct" | "group";
type MediaTab = "Media" | "Link" | "Docs";
type CreateTypePopoverRef = {
  toggle: (event: Event) => void;
  hide: () => void;
};

const { listChats, listUsers, searchUsers, addContact, createDirect, createGroup, listMessages, sendMessage, markRead } =
  useChatsApi();
const { echo, connect, disconnect, realtimeStatus, isRealtimeReachable } = useEcho();
const auth = useAuth();
const toast = useToast();

const loadingChats = ref(true);
const loadingMessages = ref(false);
const sendingMessage = ref(false);
const creatingChat = ref(false);
const chatsError = ref("");
const messageError = ref("");
const peopleSearchError = ref("");
const peopleSearchLoading = ref(false);
const addingContactUserId = ref<string | null>(null);
const peopleSearchResults = ref<ChatUserSearchResultDto[]>([]);

const search = ref("");
const mode = ref<ChatMode>("chat");
const messageDraft = ref("");

const notificationOn = ref(true);
const soundOn = ref(true);
const saveDownloads = ref(false);
const mediaTab = ref<MediaTab>("Media");

const chats = ref<ChatSummaryDto[]>([]);
const activeChatId = ref<string | null>(null);

const messagesByChat = reactive<Record<string, ChatMessageDto[]>>({});
const messagesLoaded = reactive<Record<string, boolean>>({});
const readInFlight = reactive<Record<string, boolean>>({});

const onlineUserIds = ref<string[]>([]);
const activePresenceMembers = ref<ChatMemberDto[]>([]);

const createTypePopover = ref<CreateTypePopoverRef | null>(null);
const createDrawerVisible = ref(false);
const createMode = ref<CreateMode>("direct");
const userPickerSearch = ref("");
const userPickerLoading = ref(false);
const userPickerError = ref("");
const userOptions = ref<ChatMemberDto[]>([]);
const selectedDirectUserId = ref<string | null>(null);
const selectedGroupUserIds = ref<string[]>([]);
const groupTitle = ref("");

const subscribedChatIds = new Set<string>();
const userChannelState = reactive({ initialized: false, channelName: "" });
const globalPresenceState = reactive({ initialized: false, channelName: "" });
const activePresenceChannel = ref<string | null>(null);
const isMobileViewport = ref(false);
const mobileThreadOpen = ref(false);
const mobileDragOffsetX = ref(0);
const mobileDragPointerId = ref<number | null>(null);
const mobileDragStartX = ref(0);
const mobileDragStartY = ref(0);
let userSearchTimer: ReturnType<typeof setTimeout> | null = null;
let peopleSearchTimer: ReturnType<typeof setTimeout> | null = null;
let viewportMediaQuery: MediaQueryList | null = null;
let fallbackPollingTimer: ReturnType<typeof setInterval> | null = null;

const extractError = (error: unknown): string => {
  const data = (error as { data?: ErrorResponse })?.data;

  if (data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey) {
      return data.errors[firstKey]?.[0] ?? "Request failed.";
    }
  }

  return data?.message ?? (error as { message?: string })?.message ?? "Request failed.";
};

const onlineSet = computed(() => new Set(onlineUserIds.value));
const searchQueryNormalized = computed(() => search.value.trim());
const showPeopleSearch = computed(() => searchQueryNormalized.value.length >= 2);
const mobileThreadVisible = computed(() => !isMobileViewport.value || mobileThreadOpen.value);
const mobileDragging = computed(() => mobileDragPointerId.value !== null);
const mobileThreadInlineStyle = computed(() =>
  isMobileViewport.value ? ({ "--mobile-thread-offset": `${mobileDragOffsetX.value}px` } as const) : undefined
);
const realtimeUnavailable = computed(() => realtimeStatus.value === "unavailable");

const chatSkeletonRows = [1, 2, 3, 4, 5, 6];
const messageSkeletonRows = [1, 2, 3, 4, 5];
const memberSkeletonRows = [1, 2, 3, 4];

const filteredConversations = computed(() => {
  if (mode.value === "call") {
    return [] as ChatSummaryDto[];
  }

  const query = search.value.toLowerCase().trim();

  if (!query) {
    return chats.value;
  }

  return chats.value.filter((chat) => {
    const target = `${chat.title} ${chat.subtitle} ${chat.last_message_preview ?? ""}`.toLowerCase();
    return target.includes(query);
  });
});

const activeConversation = computed(() => {
  if (!activeChatId.value) {
    return null;
  }

  return chats.value.find((chat) => chat.id === activeChatId.value) ?? null;
});

const activeMessages = computed(() => {
  if (!activeChatId.value) {
    return [] as ChatMessageDto[];
  }

  return messagesByChat[activeChatId.value] ?? [];
});

const activeMembers = computed(() => activeConversation.value?.participants ?? []);

const activeSubtitle = computed(() => {
  const chat = activeConversation.value;

  if (!chat) {
    return "";
  }

  if (chat.type === "direct") {
    const targetId = chat.direct_target?.id;
    return targetId && onlineSet.value.has(targetId) ? "Online" : "Offline";
  }

  const onlineCount = activePresenceMembers.value.length;
  return `${onlineCount} online`;
});

const filteredMedia = computed(() => {
  return media.filter((item) => item.type === mediaTab.value);
});

const isChatOnline = (chat: ChatSummaryDto) => {
  return chat.type === "direct" && Boolean(chat.direct_target?.id && onlineSet.value.has(chat.direct_target.id));
};

const chatAvatarLabel = (chat: ChatSummaryDto) => {
  return chat.title.slice(0, 2).toUpperCase();
};

const formatTime = (iso: string | null) => {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();
  const isSameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const chatSortScore = (chat: ChatSummaryDto) => {
  if (chat.last_message_at) {
    const score = new Date(chat.last_message_at).getTime();
    if (!Number.isNaN(score)) {
      return score;
    }
  }

  return 0;
};

const reorderChats = () => {
  chats.value = [...chats.value].sort((a, b) => chatSortScore(b) - chatSortScore(a));
};

const upsertChat = (chat: ChatSummaryDto, moveToTop = true) => {
  const index = chats.value.findIndex((item) => item.id === chat.id);

  if (index >= 0) {
    const existing = chats.value[index];

    if (!existing) {
      chats.value.push(chat);
      if (moveToTop) {
        reorderChats();
      }
      return;
    }

    chats.value[index] = {
      ...existing,
      ...chat,
      participants: chat.participants?.length ? chat.participants : existing.participants,
      unread_count: typeof chat.unread_count === "number" ? chat.unread_count : existing.unread_count
    };
  } else {
    chats.value.push(chat);
  }

  if (moveToTop) {
    reorderChats();
  }
};

const appendMessage = (chatId: string, message: ChatMessageDto) => {
  if (!messagesByChat[chatId]) {
    messagesByChat[chatId] = [];
  }

  const exists = messagesByChat[chatId].some((item) => item.id === message.id);
  if (!exists) {
    messagesByChat[chatId].push(message);
    messagesByChat[chatId] = [...messagesByChat[chatId]].sort((a, b) => Number(a.id) - Number(b.id));
  }

  const chat = chats.value.find((item) => item.id === chatId);
  if (chat) {
    chat.last_message_preview = message.body;
    chat.last_message_at = message.created_at;
    if (message.is_mine) {
      chat.unread_count = 0;
      chat.my_last_read_message_id = message.id;
    }

    reorderChats();
  }
};

const markChatAsRead = async (chatId: string, messageId?: string) => {
  if (readInFlight[chatId]) {
    return;
  }

  const messages = messagesByChat[chatId] ?? [];
  const latest = messageId ?? messages[messages.length - 1]?.id;

  if (!latest) {
    return;
  }

  const chat = chats.value.find((item) => item.id === chatId);

  if (chat?.my_last_read_message_id === latest && chat.unread_count === 0) {
    return;
  }

  readInFlight[chatId] = true;

  try {
    await markRead(chatId, latest);

    if (chat) {
      chat.my_last_read_message_id = latest;
      chat.unread_count = 0;
    }
  } catch {
    // Silently ignore read marker errors to avoid noisy UX.
  } finally {
    readInFlight[chatId] = false;
  }
};

const ensureMessagesLoaded = async (chatId: string) => {
  if (messagesLoaded[chatId]) {
    return;
  }

  loadingMessages.value = true;
  messageError.value = "";

  try {
    const response = await listMessages(chatId);
    messagesByChat[chatId] = response.messages;
    messagesLoaded[chatId] = true;

    await markChatAsRead(chatId);
  } catch (error) {
    messageError.value = extractError(error);
  } finally {
    loadingMessages.value = false;
  }
};

const reloadMessages = async (chatId: string, markAsRead = false) => {
  loadingMessages.value = true;
  messageError.value = "";

  try {
    const response = await listMessages(chatId);
    messagesByChat[chatId] = response.messages;
    messagesLoaded[chatId] = true;

    if (markAsRead) {
      await markChatAsRead(chatId);
    }
  } catch (error) {
    messageError.value = extractError(error);
  } finally {
    loadingMessages.value = false;
  }
};

const normalizePresenceMember = (member: any): ChatMemberDto => {
  return {
    id: String(member?.id ?? ""),
    nickname: String(member?.nickname ?? "User"),
    email: String(member?.email ?? ""),
    avatar_url: typeof member?.avatar_url === "string" ? member.avatar_url : null
  };
};

const joinActivePresence = async (chatId: string) => {
  const echo = await connect();
  if (!echo) {
    return;
  }

  if (activePresenceChannel.value) {
    echo.leave(activePresenceChannel.value);
  }

  activePresenceMembers.value = [];

  const channelName = `chat-presence.${chatId}`;
  activePresenceChannel.value = channelName;

  echo
    .join(channelName)
    .here((members: any[]) => {
      activePresenceMembers.value = members.map((member) => normalizePresenceMember(member));
    })
    .joining((member: any) => {
      const normalized = normalizePresenceMember(member);
      if (!activePresenceMembers.value.some((item) => item.id === normalized.id)) {
        activePresenceMembers.value = [...activePresenceMembers.value, normalized];
      }
    })
    .leaving((member: any) => {
      const leavingId = String(member?.id ?? "");
      activePresenceMembers.value = activePresenceMembers.value.filter((item) => item.id !== leavingId);
    });
};

const onMessageEvent = async (payload: ChatMessageBroadcastPayload) => {
  appendMessage(payload.chat_id, payload.message);

  if (activeChatId.value === payload.chat_id && !payload.message.is_mine) {
    await markChatAsRead(payload.chat_id, payload.message.id);
  }
};

const onReadUpdatedEvent = (payload: ChatReadUpdatedBroadcastPayload) => {
  const chat = chats.value.find((item) => item.id === payload.chat_id);
  if (!chat) {
    return;
  }

  if (chat.my_last_read_message_id === null || Number(payload.last_read_message_id ?? 0) > Number(chat.my_last_read_message_id ?? 0)) {
    // We only keep current user's read marker in this screen.
  }
};

const syncPrivateChatSubscriptions = async () => {
  const echo = await connect();
  if (!echo) {
    return;
  }

  const currentIds = new Set(chats.value.map((chat) => chat.id));

  currentIds.forEach((chatId) => {
    if (subscribedChatIds.has(chatId)) {
      return;
    }

    echo
      .private(`chat.${chatId}`)
      .listen(".chat.message.sent", (payload: ChatMessageBroadcastPayload) => {
        void onMessageEvent(payload);
      })
      .listen(".chat.read.updated", (payload: ChatReadUpdatedBroadcastPayload) => {
        onReadUpdatedEvent(payload);
      });

    subscribedChatIds.add(chatId);
  });

  [...subscribedChatIds].forEach((chatId) => {
    if (currentIds.has(chatId)) {
      return;
    }

    echo.leave(`chat.${chatId}`);
    subscribedChatIds.delete(chatId);
  });
};

const initUserChannel = async () => {
  const echo = await connect();
  const myUserId = auth.state.value.user?.id;

  if (!echo || !myUserId || userChannelState.initialized) {
    return;
  }

  const channelName = `user.${myUserId}`;

  echo
    .private(channelName)
    .listen(".chat.created", (payload: ChatCreatedBroadcastPayload) => {
      upsertChat(payload.chat, true);
      void syncPrivateChatSubscriptions();

      if (!activeChatId.value) {
        activeChatId.value = payload.chat.id;
      }

      toast.add({
        severity: "info",
        summary: "New chat",
        detail: `You were added to \"${payload.chat.title}\"`,
        life: 2500
      });
    })
    .listen(".chat.message.notification", (payload: ChatMessageNotificationBroadcastPayload) => {
      upsertChat({ ...payload.chat, unread_count: payload.unread_count }, true);

      if (activeChatId.value === payload.chat.id) {
        appendMessage(payload.chat.id, payload.message);
        void markChatAsRead(payload.chat.id, payload.message.id);
      } else {
        toast.add({
          severity: "success",
          summary: payload.message.sender.nickname,
          detail: payload.message.body ?? "New message",
          life: 2400
        });
      }
    });

  userChannelState.initialized = true;
  userChannelState.channelName = channelName;
};

const initGlobalPresence = async () => {
  const echo = await connect();

  if (!echo || globalPresenceState.initialized) {
    return;
  }

  const channelName = "global-online";

  echo
    .join(channelName)
    .here((members: any[]) => {
      onlineUserIds.value = members.map((member) => String(member?.id ?? "")).filter(Boolean);
    })
    .joining((member: any) => {
      const id = String(member?.id ?? "");
      if (!id || onlineUserIds.value.includes(id)) {
        return;
      }

      onlineUserIds.value = [...onlineUserIds.value, id];
    })
    .leaving((member: any) => {
      const id = String(member?.id ?? "");
      onlineUserIds.value = onlineUserIds.value.filter((item) => item !== id);
    });

  globalPresenceState.initialized = true;
  globalPresenceState.channelName = channelName;
};

const stopFallbackPolling = () => {
  if (!fallbackPollingTimer) {
    return;
  }

  clearInterval(fallbackPollingTimer);
  fallbackPollingTimer = null;
};

const startFallbackPolling = () => {
  if (fallbackPollingTimer) {
    return;
  }

  fallbackPollingTimer = setInterval(() => {
    if (document.hidden) {
      return;
    }

    void (async () => {
      await refreshChats(true);

      if (activeChatId.value) {
        await reloadMessages(activeChatId.value, false);
      }
    })();
  }, 4000);
};

const syncRealtimeTransport = async () => {
  const reachable = await isRealtimeReachable(true);

  if (!reachable) {
    startFallbackPolling();
    return;
  }

  const connected = await connect();
  if (connected) {
    stopFallbackPolling();
    return;
  }

  startFallbackPolling();
};

const refreshChats = async (silent = false) => {
  if (!silent) {
    loadingChats.value = true;
  }

  chatsError.value = "";

  try {
    const response = await listChats();
    chats.value = response.chats;
    reorderChats();

    const hasCurrentActive = Boolean(activeChatId.value && chats.value.some((chat) => chat.id === activeChatId.value));

    if (!hasCurrentActive) {
      activeChatId.value = isMobileViewport.value ? null : (chats.value[0]?.id ?? null);
    }

    await syncPrivateChatSubscriptions();
  } catch (error) {
    chatsError.value = extractError(error);
  } finally {
    if (!silent) {
      loadingChats.value = false;
    }
  }
};

const selectConversation = async (chatId: string) => {
  activeChatId.value = chatId;
  if (isMobileViewport.value) {
    mobileThreadOpen.value = true;
  }

  const chat = chats.value.find((item) => item.id === chatId);
  if (chat) {
    chat.unread_count = 0;
  }

  await ensureMessagesLoaded(chatId);
  await joinActivePresence(chatId);
  await markChatAsRead(chatId);
};

const onSendMessage = async () => {
  const chat = activeConversation.value;
  if (!chat) {
    return;
  }

  const body = messageDraft.value.trim();

  if (!body || sendingMessage.value) {
    return;
  }

  sendingMessage.value = true;
  messageError.value = "";

  try {
    const response = await sendMessage(chat.id, body);
    appendMessage(chat.id, response.message);
    upsertChat(response.chat, true);
    messageDraft.value = "";
  } catch (error) {
    messageError.value = extractError(error);
  } finally {
    sendingMessage.value = false;
  }
};

const openCreateTypeDialog = (event: Event) => {
  createTypePopover.value?.toggle(event);
};

const openCreateDrawer = async (modeValue: CreateMode) => {
  createMode.value = modeValue;
  createTypePopover.value?.hide();
  createDrawerVisible.value = true;
  userPickerError.value = "";

  if (!userOptions.value.length) {
    await loadUserOptions();
  }
};

const loadUserOptions = async () => {
  userPickerLoading.value = true;
  userPickerError.value = "";

  try {
    const response = await listUsers(userPickerSearch.value);
    userOptions.value = response.users;
  } catch (error) {
    userPickerError.value = extractError(error);
  } finally {
    userPickerLoading.value = false;
  }
};

const loadPeopleSearch = async () => {
  if (!showPeopleSearch.value) {
    peopleSearchResults.value = [];
    peopleSearchError.value = "";
    peopleSearchLoading.value = false;
    return;
  }

  peopleSearchLoading.value = true;
  peopleSearchError.value = "";

  try {
    const response = await searchUsers(searchQueryNormalized.value);
    peopleSearchResults.value = response.users;
  } catch (error) {
    peopleSearchError.value = extractError(error);
  } finally {
    peopleSearchLoading.value = false;
  }
};

const onAddContact = async (user: ChatUserSearchResultDto) => {
  if (addingContactUserId.value || user.is_contact) {
    return;
  }

  addingContactUserId.value = user.id;
  peopleSearchError.value = "";

  try {
    const response = await addContact(user.id);

    peopleSearchResults.value = peopleSearchResults.value.map((item) =>
      item.id === user.id ? { ...item, is_contact: true } : item
    );

    await loadUserOptions();

    toast.add({
      severity: response.created ? "success" : "info",
      summary: response.created ? "Contact added" : "Already in contacts",
      detail: user.nickname,
      life: 2200
    });
  } catch (error) {
    peopleSearchError.value = extractError(error);
  } finally {
    addingContactUserId.value = null;
  }
};

const syncMobileViewport = () => {
  if (!import.meta.client) {
    return;
  }

  const nextIsMobile = window.matchMedia("(max-width: 760px)").matches;
  isMobileViewport.value = nextIsMobile;

  if (!nextIsMobile) {
    mobileThreadOpen.value = false;
    mobileDragOffsetX.value = 0;
    mobileDragPointerId.value = null;
  }
};

const closeMobileThread = () => {
  if (!isMobileViewport.value) {
    return;
  }

  mobileThreadOpen.value = false;
  activeChatId.value = null;
  activePresenceMembers.value = [];
  mobileDragOffsetX.value = 0;
  mobileDragPointerId.value = null;

  if (echo.value && activePresenceChannel.value) {
    echo.value.leave(activePresenceChannel.value);
    activePresenceChannel.value = null;
  }
};

const finishMobileThreadDrag = () => {
  if (!isMobileViewport.value || !mobileThreadOpen.value) {
    mobileDragOffsetX.value = 0;
    mobileDragPointerId.value = null;
    return;
  }

  const closeThreshold = Math.max(96, window.innerWidth * 0.24);

  if (mobileDragOffsetX.value >= closeThreshold) {
    closeMobileThread();
    return;
  }

  mobileDragOffsetX.value = 0;
  mobileDragPointerId.value = null;
};

const onMobileThreadDragStart = (event: PointerEvent) => {
  if (!isMobileViewport.value || !mobileThreadOpen.value) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  mobileDragPointerId.value = event.pointerId;
  mobileDragStartX.value = event.clientX;
  mobileDragStartY.value = event.clientY;
  mobileDragOffsetX.value = 0;

  (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
};

const onMobileThreadDragMove = (event: PointerEvent) => {
  if (!isMobileViewport.value || !mobileThreadOpen.value) {
    return;
  }

  if (mobileDragPointerId.value !== event.pointerId) {
    return;
  }

  const deltaX = event.clientX - mobileDragStartX.value;
  const deltaY = Math.abs(event.clientY - mobileDragStartY.value);

  if (deltaY > 28 && deltaY > Math.abs(deltaX)) {
    return;
  }

  mobileDragOffsetX.value = Math.max(0, deltaX);
};

const onMobileThreadDragEnd = (event: PointerEvent) => {
  if (mobileDragPointerId.value !== event.pointerId) {
    return;
  }

  finishMobileThreadDrag();
};

const selectedDirectUser = computed(() => {
  if (!selectedDirectUserId.value) {
    return null;
  }

  return userOptions.value.find((user) => user.id === selectedDirectUserId.value) ?? null;
});

const canCreateChat = computed(() => {
  if (creatingChat.value) {
    return false;
  }

  if (createMode.value === "direct") {
    return Boolean(selectedDirectUserId.value);
  }

  return groupTitle.value.trim().length >= 2 && selectedGroupUserIds.value.length > 0;
});

const submitCreateChat = async () => {
  if (!canCreateChat.value) {
    return;
  }

  creatingChat.value = true;
  userPickerError.value = "";

  try {
    const response =
      createMode.value === "direct" && selectedDirectUserId.value
        ? await createDirect(selectedDirectUserId.value)
        : await createGroup(groupTitle.value, selectedGroupUserIds.value);

    upsertChat(response.chat, true);
    await syncPrivateChatSubscriptions();

    createDrawerVisible.value = false;
    selectedDirectUserId.value = null;
    selectedGroupUserIds.value = [];
    groupTitle.value = "";

    await selectConversation(response.chat.id);

    if (createMode.value === "direct") {
      toast.add({
        severity: response.created ? "success" : "info",
        summary: response.created ? "Chat created" : "Chat opened",
        detail: response.chat.title,
        life: 2200
      });
    } else {
      toast.add({
        severity: "success",
        summary: "Group created",
        detail: response.chat.title,
        life: 2200
      });
    }
  } catch (error) {
    userPickerError.value = extractError(error);
  } finally {
    creatingChat.value = false;
  }
};

watch(userPickerSearch, () => {
  if (!createDrawerVisible.value) {
    return;
  }

  if (userSearchTimer) {
    clearTimeout(userSearchTimer);
  }

  userSearchTimer = setTimeout(() => {
    void loadUserOptions();
  }, 260);
});

watch(search, () => {
  peopleSearchError.value = "";

  if (peopleSearchTimer) {
    clearTimeout(peopleSearchTimer);
  }

  if (!showPeopleSearch.value) {
    peopleSearchResults.value = [];
    peopleSearchLoading.value = false;
    return;
  }

  peopleSearchTimer = setTimeout(() => {
    void loadPeopleSearch();
  }, 260);
});

watch(createDrawerVisible, (visible) => {
  if (!visible) {
    selectedDirectUserId.value = null;
    selectedGroupUserIds.value = [];
    groupTitle.value = "";
    userPickerSearch.value = "";
    userPickerError.value = "";
  }
});

watch(isMobileViewport, (nextIsMobile) => {
  if (!nextIsMobile && !activeChatId.value && chats.value.length > 0) {
    activeChatId.value = chats.value[0]?.id ?? null;
  }

  if (nextIsMobile && !activeChatId.value) {
    mobileThreadOpen.value = false;
  }
});

watch(realtimeStatus, (status) => {
  if (status === "connected") {
    stopFallbackPolling();
    return;
  }

  if (status === "unavailable") {
    startFallbackPolling();
  }
});

watch(activeChatId, (nextId) => {
  if (!nextId) {
    return;
  }

  void ensureMessagesLoaded(nextId);
  void joinActivePresence(nextId);
  void markChatAsRead(nextId);
});

onMounted(async () => {
  syncMobileViewport();
  viewportMediaQuery = window.matchMedia("(max-width: 760px)");
  viewportMediaQuery.addEventListener("change", syncMobileViewport);

  await refreshChats();
  await syncRealtimeTransport();
  await initUserChannel();
  await initGlobalPresence();

  if (activeChatId.value) {
    await ensureMessagesLoaded(activeChatId.value);
    await joinActivePresence(activeChatId.value);
  }
});

onBeforeUnmount(() => {
  if (userSearchTimer) {
    clearTimeout(userSearchTimer);
    userSearchTimer = null;
  }

  if (peopleSearchTimer) {
    clearTimeout(peopleSearchTimer);
    peopleSearchTimer = null;
  }

  if (viewportMediaQuery) {
    viewportMediaQuery.removeEventListener("change", syncMobileViewport);
    viewportMediaQuery = null;
  }

  stopFallbackPolling();

  if (echo.value) {
    if (userChannelState.channelName) {
      echo.value.leave(userChannelState.channelName);
    }

    if (globalPresenceState.channelName) {
      echo.value.leave(globalPresenceState.channelName);
    }

    if (activePresenceChannel.value) {
      echo.value.leave(activePresenceChannel.value);
    }

    subscribedChatIds.forEach((chatId) => {
      echo.value?.leave(`chat.${chatId}`);
    });
  }

  disconnect();
});

const media = [
  { id: 1, type: "Media", title: "Dashboard", image: "https://picsum.photos/seed/media1/220/140" },
  { id: 2, type: "Media", title: "Wireframe", image: "https://picsum.photos/seed/media2/220/140" },
  { id: 3, type: "Docs", title: "Spec", image: "https://picsum.photos/seed/media3/220/140" },
  { id: 4, type: "Link", title: "Reference", image: "https://picsum.photos/seed/media4/220/140" }
];
</script>

<template>
  <section class="chat-demo">
    <aside class="chat-list-panel">
      <header class="chat-panel-head">
        <h1>Chats</h1>
        <Button text rounded icon="pi pi-plus" @click="openCreateTypeDialog($event)" />
      </header>

      <span class="search-wrap">
        <i class="pi pi-search" />
        <InputText v-model="search" placeholder="Search" />
      </span>

      <div v-if="showPeopleSearch" class="people-search-block">
        <div class="people-search-head">
          <strong>People</strong>
          <span v-if="peopleSearchLoading">Searching...</span>
        </div>

        <Message v-if="peopleSearchError" severity="error" size="small">{{ peopleSearchError }}</Message>

        <ul class="people-search-list">
          <li v-for="user in peopleSearchResults" :key="user.id" class="people-search-row">
            <div class="people-search-user">
              <Avatar
                :image="user.avatar_url ?? undefined"
                :label="user.avatar_url ? undefined : user.nickname.slice(0, 2).toUpperCase()"
                shape="circle"
              />
              <div>
                <strong>{{ user.nickname }}</strong>
                <small>{{ user.email }}</small>
              </div>
            </div>

            <Button
              size="small"
              rounded
              :label="user.is_contact ? 'In contacts' : 'Add'"
              :severity="user.is_contact ? 'secondary' : undefined"
              :outlined="user.is_contact"
              :disabled="user.is_contact || addingContactUserId === user.id"
              :loading="addingContactUserId === user.id"
              @click="onAddContact(user)"
            />
          </li>

          <li v-if="!peopleSearchLoading && !peopleSearchResults.length" class="people-search-empty">
            <i class="pi pi-users" />
            <span>No users found by this nickname or email.</span>
          </li>
        </ul>
      </div>

      <div class="mode-switch">
        <Button
          label="Chat"
          rounded
          size="small"
          :severity="mode === 'chat' ? undefined : 'secondary'"
          :text="mode !== 'chat'"
          @click="mode = 'chat'"
        />
        <Button
          label="Call"
          rounded
          size="small"
          :severity="mode === 'call' ? undefined : 'secondary'"
          :text="mode !== 'call'"
          @click="mode = 'call'"
        />
      </div>

      <Message v-if="realtimeUnavailable" severity="warn" size="small">
        Realtime is temporarily unavailable. Messages auto-refresh every few seconds.
      </Message>
      <Message v-if="chatsError" severity="error" size="small">{{ chatsError }}</Message>

      <ul v-if="mode === 'chat'" class="chat-rows">
        <template v-if="loadingChats">
          <li v-for="row in chatSkeletonRows" :key="`chat-skeleton-${row}`" class="chat-row-skeleton">
            <Skeleton shape="circle" size="2.6rem" />
            <div class="chat-row-skeleton-lines">
              <Skeleton height="0.85rem" width="62%" />
              <Skeleton height="0.75rem" width="86%" />
            </div>
            <Skeleton shape="circle" size="1.4rem" />
          </li>
        </template>

        <template v-else>
          <li
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            :class="{ active: activeConversation?.id === conversation.id }"
            @click="selectConversation(conversation.id)"
          >
            <div class="avatar-online-wrap">
              <Avatar
                :image="conversation.avatar_url ?? undefined"
                :label="conversation.avatar_url ? undefined : chatAvatarLabel(conversation)"
                shape="circle"
              />
              <span v-if="isChatOnline(conversation)" class="online-dot" />
            </div>

            <div class="meta">
              <div class="line-1">
                <strong>{{ conversation.title }}</strong>
                <span>{{ formatTime(conversation.last_message_at) }}</span>
              </div>
              <p>{{ conversation.last_message_preview || 'No messages yet' }}</p>
            </div>

            <Badge v-if="conversation.unread_count" :value="conversation.unread_count" />
          </li>

          <li v-if="!filteredConversations.length" class="chat-empty-row">
            <p>No chats found.</p>
          </li>
        </template>
      </ul>

      <div v-else class="chat-empty-state">
        <i class="pi pi-phone" />
        <p>Calls are not implemented yet.</p>
      </div>
    </aside>

    <section
      class="thread-panel"
      :class="{ 'mobile-open': mobileThreadVisible, 'mobile-dragging': mobileDragging }"
      :style="mobileThreadInlineStyle"
    >
      <header
        v-if="activeConversation"
        class="thread-head"
        @pointerdown="onMobileThreadDragStart"
        @pointermove="onMobileThreadDragMove"
        @pointerup="onMobileThreadDragEnd"
        @pointercancel="onMobileThreadDragEnd"
        @lostpointercapture="onMobileThreadDragEnd"
      >
        <div class="thread-head-left">
          <Button
            text
            rounded
            severity="secondary"
            icon="pi pi-arrow-left"
            class="mobile-back-button"
            @pointerdown.stop
            @click.stop="closeMobileThread"
          />

          <div class="thread-title">
            <Avatar
              :image="activeConversation.avatar_url ?? undefined"
              :label="activeConversation.avatar_url ? undefined : chatAvatarLabel(activeConversation)"
              shape="circle"
            />
            <div>
              <h2>{{ activeConversation.title }}</h2>
              <p>{{ activeConversation.type === 'group' ? `${activeConversation.participants_count} members` : activeSubtitle }}</p>
            </div>
          </div>
        </div>

        <div class="thread-actions">
          <Button text rounded severity="secondary" icon="pi pi-phone" disabled />
          <Button text rounded severity="secondary" icon="pi pi-search" />
          <Button text rounded severity="secondary" icon="pi pi-ellipsis-h" />
        </div>
      </header>

      <header v-else-if="loadingChats" class="thread-head thread-head-loading">
        <div class="thread-title">
          <Skeleton shape="circle" size="2.4rem" />
          <div class="thread-title-lines">
            <Skeleton height="0.95rem" width="8rem" />
            <Skeleton height="0.78rem" width="5rem" />
          </div>
        </div>
      </header>

      <div v-if="loadingChats && !activeConversation" class="thread-scroll thread-skeleton-scroll">
        <div class="hero-card hero-card-skeleton">
          <Skeleton width="100%" height="100%" />
        </div>

        <article v-for="row in messageSkeletonRows" :key="`msg-skeleton-initial-${row}`" class="message-row">
          <Skeleton shape="circle" size="1.9rem" />
          <div class="bubble bubble-skeleton">
            <Skeleton height="0.9rem" width="70%" />
            <Skeleton height="0.8rem" width="50%" />
          </div>
        </article>
      </div>

      <div v-else-if="activeConversation" class="thread-scroll">
        <div class="hero-card" />

        <Message v-if="messageError" severity="error" size="small">{{ messageError }}</Message>

        <div v-if="loadingMessages" class="thread-loading-messages">
          <article v-for="row in messageSkeletonRows" :key="`msg-skeleton-${row}`" class="message-row">
            <Skeleton v-if="row % 2 !== 0" shape="circle" size="1.8rem" />
            <div class="bubble bubble-skeleton" :class="{ mine: row % 2 === 0 }">
              <Skeleton height="0.88rem" width="68%" />
              <Skeleton height="0.76rem" width="42%" />
            </div>
            <Skeleton v-if="row % 2 === 0" shape="circle" size="1.8rem" />
          </article>
        </div>

        <template v-else>
          <article
            v-for="message in activeMessages"
            :key="message.id"
            :class="{ mine: message.is_mine }"
            class="message-row"
          >
            <Avatar
              v-if="!message.is_mine"
              :image="message.sender.avatar_url ?? undefined"
              :label="message.sender.avatar_url ? undefined : message.sender.nickname.slice(0, 2).toUpperCase()"
              shape="circle"
              size="small"
            />
            <div class="bubble">
              <div class="bubble-text">{{ message.body }}</div>
              <div class="bubble-time">{{ formatTime(message.created_at) }}</div>
            </div>
            <Avatar
              v-if="message.is_mine"
              :image="message.sender.avatar_url ?? undefined"
              :label="message.sender.avatar_url ? undefined : message.sender.nickname.slice(0, 2).toUpperCase()"
              shape="circle"
              size="small"
            />
          </article>

          <div v-if="!activeMessages.length" class="chat-empty-state">
            <i class="pi pi-comments" />
            <p>No messages yet. Start the conversation.</p>
          </div>
        </template>
      </div>

      <div v-else class="chat-empty-state thread-empty">
        <i class="pi pi-comment" />
        <p>Select a chat on the left to start messaging.</p>
      </div>

      <footer class="thread-compose">
        <Button text rounded severity="secondary" icon="pi pi-face-smile" disabled />
        <Button text rounded severity="secondary" icon="pi pi-paperclip" disabled />
        <InputText
          v-model="messageDraft"
          placeholder="Write your message..."
          :disabled="!activeConversation || sendingMessage || loadingChats"
          @keyup.enter="onSendMessage"
        />
        <Button
          rounded
          icon="pi pi-send"
          :loading="sendingMessage"
          :disabled="!activeConversation || loadingChats"
          @click="onSendMessage"
        />
      </footer>
    </section>

    <aside class="details-panel">
      <template v-if="loadingChats && !activeConversation">
        <div class="profile-block details-skeleton-profile">
          <Skeleton shape="circle" size="4.4rem" />
          <Skeleton height="1.8rem" width="9rem" />
          <Skeleton height="1rem" width="5.5rem" />
        </div>

        <div class="details-skeleton-settings">
          <Skeleton v-for="row in 3" :key="`details-setting-skeleton-${row}`" height="2.3rem" />
        </div>

        <Divider />

        <ul class="member-list details-skeleton-members">
          <li v-for="row in memberSkeletonRows" :key="`details-member-skeleton-${row}`">
            <Skeleton shape="circle" size="2rem" />
            <Skeleton height="0.9rem" width="9rem" />
            <Skeleton shape="circle" size="1rem" />
          </li>
        </ul>
      </template>

      <template v-else-if="activeConversation">
        <div class="profile-block">
          <Avatar
            :image="activeConversation.avatar_url ?? undefined"
            :label="activeConversation.avatar_url ? undefined : chatAvatarLabel(activeConversation)"
            shape="circle"
            size="xlarge"
          />
          <h3>{{ activeConversation.title }}</h3>
          <p>{{ activeSubtitle }}</p>

          <div class="quick-actions">
            <Button text rounded severity="secondary" icon="pi pi-phone" disabled />
            <Button text rounded severity="secondary" icon="pi pi-video" disabled />
            <Button text rounded severity="secondary" icon="pi pi-sign-out" disabled />
            <Button text rounded severity="secondary" icon="pi pi-info-circle" />
            <Button text rounded severity="secondary" icon="pi pi-ellipsis-v" />
          </div>
        </div>

        <div class="setting-row">
          <span><i class="pi pi-bell" /> Notification</span>
          <ToggleSwitch v-model="notificationOn" />
        </div>

        <div class="setting-row">
          <span><i class="pi pi-volume-up" /> Sound</span>
          <ToggleSwitch v-model="soundOn" />
        </div>

        <div class="setting-row">
          <span><i class="pi pi-download" /> Save to downloads</span>
          <ToggleSwitch v-model="saveDownloads" />
        </div>

        <Divider />

        <div class="member-head">
          <strong>Members</strong>
          <Button text label="See All" size="small" />
        </div>

        <ul class="member-list">
          <li v-for="member in activeMembers" :key="member.id">
            <Avatar
              :image="member.avatar_url ?? undefined"
              :label="member.avatar_url ? undefined : member.nickname.slice(0, 2).toUpperCase()"
              shape="circle"
            />
            <span>{{ member.nickname }}</span>
            <i class="pi pi-angle-right" />
          </li>
        </ul>

        <div class="mini-tabs">
          <Button
            label="Media"
            text
            rounded
            size="small"
            :severity="mediaTab === 'Media' ? undefined : 'secondary'"
            @click="mediaTab = 'Media'"
          />
          <Button
            label="Link"
            text
            rounded
            size="small"
            :severity="mediaTab === 'Link' ? undefined : 'secondary'"
            @click="mediaTab = 'Link'"
          />
          <Button
            label="Docs"
            text
            rounded
            size="small"
            :severity="mediaTab === 'Docs' ? undefined : 'secondary'"
            @click="mediaTab = 'Docs'"
          />
        </div>

        <div class="media-strip">
          <div v-for="item in filteredMedia" :key="item.id" :title="item.title" class="media-item">
            <img :src="item.image" :alt="item.title" />
          </div>
        </div>
      </template>

      <div v-else class="chat-empty-state">
        <i class="pi pi-user" />
        <p>Choose a chat to see details.</p>
      </div>
    </aside>

    <Popover ref="createTypePopover" class="create-type-popover">
      <div class="create-type-grid">
        <Button icon="pi pi-user" label="Personal chat" @click="openCreateDrawer('direct')" />
        <Button icon="pi pi-users" label="Group chat" severity="secondary" @click="openCreateDrawer('group')" />
      </div>
    </Popover>

    <Dialog
      v-model:visible="createDrawerVisible"
      modal
      :draggable="false"
      :style="{ width: 'min(460px, 96vw)', height: '100%' }"
      position="right"
      :header="createMode === 'direct' ? 'Start personal chat' : 'Create group chat'"
      class="create-chat-drawer"
    >
      <div class="create-chat-body">
        <div class="mode-switch">
          <Button
            label="Personal"
            rounded
            size="small"
            :severity="createMode === 'direct' ? undefined : 'secondary'"
            :text="createMode !== 'direct'"
            @click="createMode = 'direct'"
          />
          <Button
            label="Group"
            rounded
            size="small"
            :severity="createMode === 'group' ? undefined : 'secondary'"
            :text="createMode !== 'group'"
            @click="createMode = 'group'"
          />
        </div>

        <label v-if="createMode === 'group'" class="create-label">
          <span>Group name</span>
          <InputText v-model="groupTitle" placeholder="e.g. Product Team" />
        </label>

        <span class="search-wrap">
          <i class="pi pi-search" />
          <InputText v-model="userPickerSearch" placeholder="Find users" />
        </span>

        <Message v-if="userPickerError" severity="error" size="small">{{ userPickerError }}</Message>

        <div class="user-picker-list">
          <div v-if="userPickerLoading" class="chat-empty-state compact">
            <i class="pi pi-spin pi-spinner" />
            <p>Loading users...</p>
          </div>

          <button
            v-for="user in userOptions"
            v-else
            :key="user.id"
            type="button"
            class="user-picker-row"
            :class="{
              selected:
                createMode === 'direct' ? selectedDirectUserId === user.id : selectedGroupUserIds.includes(user.id)
            }"
            @click="
              createMode === 'direct'
                ? (selectedDirectUserId = user.id)
                : selectedGroupUserIds.includes(user.id)
                  ? (selectedGroupUserIds = selectedGroupUserIds.filter((id) => id !== user.id))
                  : (selectedGroupUserIds = [...selectedGroupUserIds, user.id])
            "
          >
            <Avatar
              :image="user.avatar_url ?? undefined"
              :label="user.avatar_url ? undefined : user.nickname.slice(0, 2).toUpperCase()"
              shape="circle"
            />
            <div>
              <strong>{{ user.nickname }}</strong>
              <small>{{ user.email }}</small>
            </div>
            <i
              class="pi"
              :class="
                createMode === 'direct'
                  ? selectedDirectUserId === user.id
                    ? 'pi-check-circle'
                    : 'pi-circle'
                  : selectedGroupUserIds.includes(user.id)
                    ? 'pi-check-square'
                    : 'pi-stop'
              "
            />
          </button>

          <div v-if="!userPickerLoading && !userOptions.length" class="chat-empty-state compact">
            <i class="pi pi-users" />
            <p>No users found.</p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="createDrawerVisible = false" />
        <Button
          :label="createMode === 'direct' ? (selectedDirectUser ? `Start with ${selectedDirectUser.nickname}` : 'Start chat') : 'Create group'"
          icon="pi pi-check"
          :loading="creatingChat"
          :disabled="!canCreateChat"
          @click="submitCreateChat"
        />
      </template>
    </Dialog>
  </section>
</template>
