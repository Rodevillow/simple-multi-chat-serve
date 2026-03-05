<script setup lang="ts">
import Toast from "primevue/toast";
import AppRail from "~/components/AppRail.vue";
</script>

<template>
  <main class="demo-page-root">
    <section class="demo-shell">
      <AppRail />
      <section class="demo-stage">
        <slot />
      </section>
    </section>

    <Toast position="bottom-right" />
  </main>
</template>
