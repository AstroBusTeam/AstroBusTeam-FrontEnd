<script setup>
import {useI18n} from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <!-- barra de abajo, los textos cambian con el idioma -->
  <footer class="sb-footer">
    <span class="uppercase"><span class="sb-dot mr-2"/>{{ t('footer.status') }}</span>
    <span class="sb-muted">SafeBus © 2026 · {{ t('footer.credits') }}</span>
  </footer>
</template>

<style scoped>
.sb-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-top: 1px solid var(--sb-border);
  background: #0f0f0f;
}
</style>
