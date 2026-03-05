<script setup lang="ts">
import Button from "primevue/button";
import Divider from "primevue/divider";

interface RailItem {
  label: string;
  to: string;
  icon: string;
}

const route = useRoute();
const auth = useAuth();

const railItems: RailItem[] = [
  { label: "Overview", to: "/overview", icon: "pi pi-home" },
  { label: "Chats", to: "/chats", icon: "pi pi-comment" },
  { label: "Mails", to: "/mails", icon: "pi pi-inbox" },
  { label: "Cards", to: "/cards", icon: "pi pi-th-large" },
  { label: "Customers", to: "/customers", icon: "pi pi-user" },
  { label: "Movies", to: "/movies", icon: "pi pi-video" }
];

const isActive = (target: string) => route.path === target || route.path.startsWith(`${target}/`);

const userAvatar = computed(() => auth.state.value.user?.avatar_url ?? undefined);
const userInitials = computed(() => auth.state.value.user?.nickname.slice(0, 2).toUpperCase() ?? "ME");
const avatarImageBroken = ref(false);

watch(userAvatar, () => {
  avatarImageBroken.value = false;
});

const signOut = async () => {
  await auth.logout();
  await navigateTo("/login");
};
</script>

<template>
  <aside class="demo-rail">
    <div class="rail-top">
      <NuxtLink to="/overview" title="PrimeVue UI Demo" class="brand-box">
        <img src="/icon.svg" alt="PrimeVue" />
      </NuxtLink>
    </div>

    <nav class="rail-nav">
      <NuxtLink v-for="item in railItems" :key="item.to" :to="item.to" :title="item.label">
        <Button text rounded severity="secondary" :icon="item.icon" :class="{ active: isActive(item.to) }" />
      </NuxtLink>
    </nav>

    <div class="rail-bottom">
      <Button text rounded severity="secondary" icon="pi pi-sign-out" title="Logout" @click="signOut" />
      <NuxtLink to="/settings" title="Settings">
        <Button text rounded severity="secondary" icon="pi pi-cog" :class="{ active: isActive('/settings') }" />
      </NuxtLink>
      <Divider />
      <div class="rail-user-avatar" aria-label="Current user avatar">
        <img
          v-if="userAvatar && !avatarImageBroken"
          :src="userAvatar"
          :alt="auth.state.value.user?.nickname ?? 'User avatar'"
          @error="avatarImageBroken = true"
        />
        <span v-else>{{ userInitials }}</span>
      </div>
    </div>
  </aside>
</template>
