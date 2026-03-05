<script setup lang="ts">
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Password from "primevue/password";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

definePageMeta({
  layout: false
});

const auth = useAuth();

const form = reactive({
  email: "",
  password: ""
});

const loading = ref(false);
const errorText = ref("");

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

const submit = async () => {
  errorText.value = "";
  loading.value = true;

  try {
    await auth.login({
      email: form.email,
      password: form.password
    });

    await navigateTo("/overview");
  } catch (error) {
    errorText.value = extractError(error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <h1>Login</h1>
      <p>Sign in with your email and password.</p>

      <label>
        <span>Email</span>
        <InputText v-model="form.email" type="email" autocomplete="email" required />
      </label>

      <label>
        <span>Password</span>
        <Password
          v-model="form.password"
          :feedback="false"
          toggleMask
          autocomplete="current-password"
          required
          fluid
        />
      </label>

      <Message v-if="errorText" severity="error" size="small">{{ errorText }}</Message>

      <Button type="submit" label="Login" :loading="loading" />

      <div class="auth-links">
        <NuxtLink to="/forgot-password">Forgot password?</NuxtLink>
        <NuxtLink to="/register">Create account</NuxtLink>
      </div>
    </form>
  </main>
</template>
