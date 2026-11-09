<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

// locale is the active language of vue-i18n; changing it translates the whole interface.
const { locale, t } = useI18n();

// el switch está en true cuando el idioma es inglés
const isEnglish = computed({
  get: () => locale.value === 'en',
  set: value => locale.value = value ? 'en' : 'es'
});
</script>

<template>
  <div class="flex align-items-center gap-2 text-sm font-semibold">
    <span :class="isEnglish ? 'sb-muted' : 'sb-accent'">ES</span>
    <pv-toggle-switch v-model="isEnglish" :aria-label="t('common.language')"/>
    <span :class="isEnglish ? 'sb-accent' : 'sb-muted'">EN</span>
  </div>
</template>
