<script setup>
import { RouterView } from 'vue-router'
import ToastHost from './components/ui/ToastHost.vue'
</script>

<template>
  <div class="app-shell">
    <RouterView />
  </div>
  <ToastHost />
</template>
