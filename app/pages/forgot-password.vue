<script setup lang="ts">
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

definePageMeta({
  layout: false
});

const auth = useAuth();

const email = ref("");
const loading = ref(false);
const errorText = ref("");
const successText = ref("");

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
  successText.value = "";
  loading.value = true;

  try {
    const response = await auth.forgotPassword(email.value);
    successText.value = response.message;
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
      <h1>Forgot Password</h1>
      <p>Enter your email and we will send reset link.</p>

      <label>
        <span>Email</span>
        <InputText v-model="email" type="email" autocomplete="email" required />
      </label>

      <Message v-if="errorText" severity="error" size="small">{{ errorText }}</Message>
      <Message v-if="successText" severity="success" size="small">{{ successText }}</Message>

      <Button type="submit" label="Send reset link" :loading="loading" />

      <div class="auth-links">
        <NuxtLink to="/login">Back to login</NuxtLink>
      </div>
    </form>
  </main>
</template>
