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
const route = useRoute();

const form = reactive({
  email: String(route.query.email ?? ""),
  token: String(route.query.token ?? ""),
  password: "",
  passwordConfirmation: ""
});

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

  if (!form.token) {
    errorText.value = "Reset token is missing.";
    return;
  }

  if (form.password !== form.passwordConfirmation) {
    errorText.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    const response = await auth.resetPassword({
      email: form.email,
      token: form.token,
      password: form.password,
      passwordConfirmation: form.passwordConfirmation
    });

    successText.value = response.message;

    setTimeout(() => {
      navigateTo("/login");
    }, 900);
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
      <h1>Reset Password</h1>
      <p>Set a new password for your account.</p>

      <label>
        <span>Email</span>
        <InputText v-model="form.email" type="email" autocomplete="email" required />
      </label>

      <label>
        <span>Token</span>
        <InputText v-model="form.token" required />
      </label>

      <label>
        <span>New Password</span>
        <Password
          v-model="form.password"
          :feedback="false"
          toggleMask
          autocomplete="new-password"
          required
          fluid
        />
        <small class="field-hint">At least 8 chars, uppercase, lowercase and number.</small>
      </label>

      <label>
        <span>Confirm New Password</span>
        <Password
          v-model="form.passwordConfirmation"
          :feedback="false"
          toggleMask
          autocomplete="new-password"
          required
          fluid
        />
      </label>

      <Message v-if="errorText" severity="error" size="small">{{ errorText }}</Message>
      <Message v-if="successText" severity="success" size="small">{{ successText }}</Message>

      <Button type="submit" label="Reset password" :loading="loading" />

      <div class="auth-links">
        <NuxtLink to="/login">Back to login</NuxtLink>
      </div>
    </form>
  </main>
</template>
