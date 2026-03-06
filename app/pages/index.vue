<script setup lang="ts">
import Button from "primevue/button";

definePageMeta({
  layout: false
});
</script>

<template>
  <main class="landing-page">
    <section class="landing-card">
      <p>Landing</p>
      <h1>Simple Multi Chat</h1>
      <div class="landing-actions">
        <NuxtLink to="/login">
          <Button label="Login" />
        </NuxtLink>
        <NuxtLink to="/register">
          <Button label="Register" severity="secondary" outlined />
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
