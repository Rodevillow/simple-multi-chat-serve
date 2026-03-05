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
  nickname: "",
  email: "",
  password: "",
  passwordConfirmation: ""
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

  if (form.password !== form.passwordConfirmation) {
    errorText.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    await auth.register({
      nickname: form.nickname,
      email: form.email,
      password: form.password,
      passwordConfirmation: form.passwordConfirmation
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
      <h1>Register</h1>
      <p>Create an account with nickname, email and password.</p>

      <label>
        <span>Nickname</span>
        <InputText v-model="form.nickname" autocomplete="nickname" required />
      </label>

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
          autocomplete="new-password"
          required
          fluid
        />
        <small class="field-hint">At least 8 chars, uppercase, lowercase and number.</small>
      </label>

      <label>
        <span>Confirm Password</span>
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

      <Button type="submit" label="Create account" :loading="loading" />

      <div class="auth-links">
        <NuxtLink to="/login">Already have account?</NuxtLink>
      </div>
    </form>
  </main>
</template>
