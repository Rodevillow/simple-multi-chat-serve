<script setup lang="ts">
import Avatar from "primevue/avatar";
import Badge from "primevue/badge";
import Button from "primevue/button";
import Divider from "primevue/divider";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  mine?: boolean;
  avatar?: string;
  label?: string;
}

interface Conversation {
  id: string;
  name: string;
  subtitle: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatar?: string;
  label?: string;
  type: "chat" | "call";
  messages: ChatMessage[];
}

const search = ref("");
const mode = ref<"chat" | "call">("chat");
const messageDraft = ref("");
const notificationOn = ref(true);
const soundOn = ref(false);
const saveDownloads = ref(false);
const mediaTab = ref<"Media" | "Link" | "Docs">("Media");

const conversations = ref<Conversation[]>([
  {
    id: "1",
    name: "Cody Fisher",
    subtitle: "Online",
    lastMessage: "Hey there! I've heard about...",
    time: "12.30",
    unread: 8,
    avatar: "https://i.pravatar.cc/120?img=12",
    type: "chat",
    messages: []
  },
  {
    id: "2",
    name: "PrimeTek",
    subtitle: "@primetek",
    lastMessage: "Let's implement PrimeVue. Elevating...",
    time: "11.15",
    label: "PT",
    type: "chat",
    messages: [
      {
        id: "m1",
        author: "Cody",
        text: "Do you have any tips for optimizing performance when using multiple complex components?",
        avatar: "https://i.pravatar.cc/120?img=12"
      },
      {
        id: "m2",
        author: "Jerome",
        text: "Yes! Lazy loading and code splitting can make a huge difference, especially in larger applications.",
        avatar: "https://i.pravatar.cc/120?img=24"
      },
      {
        id: "m3",
        author: "Howard",
        text: "I've also found that leveraging the component's internal state management capabilities can help streamline data flow and improve performance.",
        label: "HS"
      },
      {
        id: "m4",
        author: "You",
        text: "That's great advice. It's amazing how much detail and thought has gone into making PrimeVue such a powerful tool for developers.",
        mine: true,
        avatar: "https://i.pravatar.cc/120?img=5"
      }
    ]
  },
  {
    id: "3",
    name: "Jerome Bell",
    subtitle: "Design",
    lastMessage: "Absolutely! PrimeVue's...",
    time: "11.15",
    unread: 4,
    avatar: "https://i.pravatar.cc/120?img=56",
    type: "chat",
    messages: []
  },
  {
    id: "4",
    name: "Robert Fox",
    subtitle: "Support",
    lastMessage: "Interesting! PrimeVue sounds amazin...",
    time: "11.15",
    avatar: "https://i.pravatar.cc/120?img=68",
    type: "call",
    messages: []
  },
  {
    id: "5",
    name: "Esther Howard",
    subtitle: "PM",
    lastMessage: "Quick one, team! Anyone usin...",
    time: "11.15",
    unread: 9,
    avatar: "https://i.pravatar.cc/120?img=47",
    type: "chat",
    messages: []
  },
  {
    id: "6",
    name: "Darlene Robertson",
    subtitle: "QA",
    lastMessage: "Just explored PrimeVue's themes. Ca...",
    time: "11.15",
    avatar: "https://i.pravatar.cc/120?img=32",
    type: "chat",
    messages: []
  },
  {
    id: "7",
    name: "Ralph Edwards",
    subtitle: "DevOps",
    lastMessage: "PrimeVue is a game-changer, right?...",
    time: "11.15",
    avatar: "https://i.pravatar.cc/120?img=14",
    type: "chat",
    messages: []
  }
]);

const activeChatId = ref("2");

const filteredConversations = computed(() => {
  const q = search.value.toLowerCase().trim();

  return conversations.value.filter((conversation) => {
    if (conversation.type !== mode.value) {
      return false;
    }

    if (!q) {
      return true;
    }

    return (
      conversation.name.toLowerCase().includes(q) ||
      conversation.lastMessage.toLowerCase().includes(q) ||
      conversation.subtitle.toLowerCase().includes(q)
    );
  });
});

const activeConversation = computed(() => {
  return conversations.value.find((conversation) => conversation.id === activeChatId.value) ?? conversations.value[0]!;
});

const selectConversation = (id: string) => {
  activeChatId.value = id;
  const conversation = conversations.value.find((item) => item.id === id);
  if (conversation) {
    conversation.unread = 0;
  }
};

const sendMessage = () => {
  const text = messageDraft.value.trim();
  if (!text) {
    return;
  }

  const conversation = activeConversation.value;
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    author: "You",
    text,
    mine: true,
    avatar: "https://i.pravatar.cc/120?img=5"
  };

  conversation.messages.push(message);
  conversation.lastMessage = text;
  conversation.time = "now";
  messageDraft.value = "";

  const head = conversations.value.find((item) => item.id === conversation.id);
  if (head) {
    conversations.value = [head, ...conversations.value.filter((item) => item.id !== head.id)];
  }
};

const members = [
  { id: 1, name: "Robin Jonas", avatar: "https://i.pravatar.cc/100?img=11" },
  { id: 2, name: "Cameron Williamson", avatar: "https://i.pravatar.cc/100?img=21" },
  { id: 3, name: "Eleanor Pena", avatar: "https://i.pravatar.cc/100?img=45" },
  { id: 4, name: "Arlene McCoy", avatar: "https://i.pravatar.cc/100?img=52" },
  { id: 5, name: "Dianne Russell", avatar: "https://i.pravatar.cc/100?img=65" }
];

const media = [
  { id: 1, type: "Media", title: "Dashboard", image: "https://picsum.photos/seed/media1/220/140" },
  { id: 2, type: "Media", title: "Wireframe", image: "https://picsum.photos/seed/media2/220/140" },
  { id: 3, type: "Docs", title: "Spec", image: "https://picsum.photos/seed/media3/220/140" },
  { id: 4, type: "Link", title: "Reference", image: "https://picsum.photos/seed/media4/220/140" }
];

const filteredMedia = computed(() => media.filter((item) => item.type === mediaTab.value));
</script>

<template>
  <section class="chat-demo">
    <aside class="chat-list-panel">
      <header class="chat-panel-head">
        <h1>Chats</h1>
        <Button text rounded icon="pi pi-plus" />
      </header>

      <span class="search-wrap">
        <i class="pi pi-search" />
        <InputText v-model="search" placeholder="Search" />
      </span>

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

      <ul class="chat-rows">
        <li
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          :class="{ active: activeConversation.id === conversation.id }"
          @click="selectConversation(conversation.id)"
        >
          <Avatar v-if="conversation.avatar" :image="conversation.avatar" shape="circle" />
          <Avatar v-else :label="conversation.label" shape="circle" />

          <div class="meta">
            <div class="line-1">
              <strong>{{ conversation.name }}</strong>
              <span>{{ conversation.time }}</span>
            </div>
            <p>{{ conversation.lastMessage }}</p>
          </div>

          <Badge v-if="conversation.unread" :value="conversation.unread" />
        </li>
      </ul>
    </aside>

    <section class="thread-panel">
      <header class="thread-head">
        <div class="thread-title">
          <Avatar :image="activeConversation.avatar" :label="activeConversation.label" shape="circle" />
          <div>
            <h2>{{ activeConversation.name }}</h2>
            <p>Cody Fisher, Esther Howard, Jerome Bell, Kristin Watson...</p>
          </div>
        </div>

        <div class="thread-actions">
          <Button text rounded severity="secondary" icon="pi pi-phone" />
          <Button text rounded severity="secondary" icon="pi pi-search" />
          <Button text rounded severity="secondary" icon="pi pi-ellipsis-h" />
        </div>
      </header>

      <div class="thread-scroll">
        <div class="hero-card" />

        <article
          v-for="message in activeConversation.messages"
          :key="message.id"
          :class="{ mine: message.mine }"
          class="message-row"
        >
          <Avatar
            v-if="!message.mine"
            :image="message.avatar"
            :label="message.label"
            shape="circle"
            size="small"
          />
          <div class="bubble">{{ message.text }}</div>
          <Avatar
            v-if="message.mine"
            :image="message.avatar"
            :label="message.label"
            shape="circle"
            size="small"
          />
        </article>
      </div>

      <footer class="thread-compose">
        <Button text rounded severity="secondary" icon="pi pi-face-smile" />
        <Button text rounded severity="secondary" icon="pi pi-paperclip" />
        <InputText v-model="messageDraft" placeholder="Write your message..." @keyup.enter="sendMessage" />
        <Button rounded icon="pi pi-send" @click="sendMessage" />
      </footer>
    </section>

    <aside class="details-panel">
      <div class="profile-block">
        <Avatar :image="activeConversation.avatar" :label="activeConversation.label" shape="circle" size="xlarge" />
        <h3>{{ activeConversation.name }}</h3>
        <p>{{ activeConversation.subtitle }}</p>

        <div class="quick-actions">
          <Button text rounded severity="secondary" icon="pi pi-phone" />
          <Button text rounded severity="secondary" icon="pi pi-video" />
          <Button text rounded severity="secondary" icon="pi pi-sign-out" />
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
        <li v-for="member in members" :key="member.id">
          <Avatar :image="member.avatar" shape="circle" />
          <span>{{ member.name }}</span>
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
    </aside>
  </section>
</template>
