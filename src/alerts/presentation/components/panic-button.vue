<script setup>
import {onUnmounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useAlertsStore from "../../application/alerts.store.js";
import useIamStore from "../../../iam/application/iam.store.js";

// segundos que hay para cancelar la alerta
const CANCEL_SECONDS = 5;

const { t } = useI18n();
const toast = useToast();
const alertsStore = useAlertsStore();
const iamStore = useIamStore();

// estado de la pantalla de alerta
const visible = ref(false);
const sending = ref(false);
const sentAlert = ref(null);
// cuenta regresiva y su intervalo
const secondsLeft = ref(0);
let timer = null;

// envía la alerta con la ubicación del bus
const sendAlert = () => {
  sending.value = true;
  alertsStore.sendPanicAlert(iamStore.currentVehicle).then(alert => {
    sentAlert.value = alert;
    visible.value = true;
    startCountdown();
  }).catch(() => {
    toast.add({ severity: 'error', summary: t('panic.error'), detail: t('panic.error-detail'), life: 4000 });
  }).finally(() => sending.value = false);
};

// cuenta regresiva para cancelar
const startCountdown = () => {
  secondsLeft.value = CANCEL_SECONDS;
  timer = setInterval(() => {
    secondsLeft.value--;
    if (secondsLeft.value <= 0) stopCountdown();
  }, 1000);
};

// detiene la cuenta regresiva
const stopCountdown = () => {
  clearInterval(timer);
  timer = null;
};

// cancelar = eliminar la alerta
const cancelAlert = () => {
  alertsStore.deleteAlert(sentAlert.value);
  toast.add({ severity: 'info', summary: t('panic.cancelled-title'), detail: t('panic.cancelled-detail', { code: sentAlert.value.code }), life: 3000 });
  close();
};

// cierra la pantalla, la alerta sigue activa
const close = () => {
  stopCountdown();
  visible.value = false;
};

// evitamos que el intervalo siga corriendo si el componente desaparece
onUnmounted(stopCountdown);
</script>

<template>
  <pv-button :label="t('toolbar.panic').toUpperCase()" icon="pi pi-exclamation-triangle" class="sb-panic-button" size="small"
             :loading="sending" @click="sendAlert"/>

  <!-- pantalla roja de alerta enviada -->
  <Teleport to="body">
    <div v-if="visible" class="panic-overlay">
      <div class="panic-card">
        <div class="panic-icon"><i class="pi pi-check"/></div>
        <h2 class="panic-title">{{ t('panic.title') }}</h2>
        <p class="panic-subtitle">{{ t('panic.subtitle') }}</p>

        <div class="panic-info">
          <div class="flex justify-content-between">
            <span class="sb-label">{{ t('panic.code') }}</span>
            <span>{{ sentAlert.code }}</span>
          </div>
          <div class="flex justify-content-between">
            <span class="sb-label">{{ t('common.gps') }}</span>
            <span class="sb-danger">{{ sentAlert.latitude }}, {{ sentAlert.longitude }}</span>
          </div>
          <div class="flex justify-content-between">
            <span class="sb-label">{{ t('common.central-status') }}</span>
            <span class="sb-accent">{{ t('common.central-notified') }} <i class="pi pi-check-circle"/></span>
          </div>
        </div>

        <!-- solo se puede cancelar durante la cuenta regresiva -->
        <pv-button class="panic-white-button w-full mb-2" :disabled="secondsLeft <= 0"
                   :label="secondsLeft > 0 ? t('panic.cancel-alert', { seconds: secondsLeft }) : t('panic.cannot-cancel')"
                   @click="cancelAlert"/>
        <pv-button class="panic-white-button w-full" :label="t('panic.ok')" @click="close"/>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.panic-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, #ff8a80 0%, #ff0000 45%);
}

.panic-card {
  width: 360px;
  max-width: calc(100% - 32px);
  padding: 2rem;
  text-align: center;
  background: #0a0a0a;
  border: 2px solid #fff;
  border-radius: 6px;
}

.panic-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
  color: #fff;
  background: var(--sb-danger);
  border: 2px solid #fff;
  border-radius: 6px;
}

.panic-title {
  margin: 1rem 0 0;
  font-size: 1.8rem;
  font-weight: 800;
  text-transform: uppercase;
}

.panic-subtitle {
  margin: 0.25rem 0 1.5rem;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sb-muted);
}

.panic-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  border: 1px solid var(--sb-border);
}

.panic-white-button.p-button {
  background: #fff;
  border-color: #fff;
  color: #000;
  font-weight: 700;
}
</style>
