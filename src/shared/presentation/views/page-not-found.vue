<script setup>
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

// The current route provides the path that does not exist.
const route = useRoute();
// ruta que el usuario intentó abrir
const unavailableRoute = route.path;
const { t } = useI18n();
</script>

<template>
  <section class="p-5 flex flex-column align-items-start gap-3">
    <h1 class="sb-title">{{ t('page-not-found.title') }}</h1>
    <p class="sb-subtitle">{{ t('page-not-found.subtitle', { 'unavailable-route': unavailableRoute }) }}</p>
    <router-link to="/operations/dashboard" class="sb-accent">{{ t('page-not-found.back') }}</router-link>
  </section>
</template>
