<script setup>
import {computed, onMounted} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useAlertsStore from "../../application/alerts.store.js";
import useFleetStore from "../../../fleet/application/fleet.store.js";
import FleetMap from "../../../shared/presentation/components/fleet-map.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const alertsStore = useAlertsStore();
const fleetStore = useFleetStore();

const alert = computed(() => alertsStore.getAlertById(route.params.id));
const vehicle = computed(() => alert.value ? fleetStore.getVehicleById(alert.value.vehicleId) : null);

// los 3 pasos de la confirmación
const steps = computed(() => {
  const status = alert.value.status;
  const failed = status === 'timeout' || status === 'critical';
  return [
    { title: 'Alerta enviada',    detail: `Hora: ${alert.value.time}`,                done: true,                    failed: false },
    { title: 'Alerta recibida',   detail: `Nodo: ${alert.value.receiver}`,            done: !failed,                 failed: failed },
    { title: 'Confirmada',        detail: `Intentos: ${alert.value.attempts}`,        done: status === 'confirmed',   failed: false }
  ];
});

// marcador en la ubicación de la alerta
const markers = computed(() => [{
  id: alert.value.id, latitude: alert.value.latitude, longitude: alert.value.longitude, danger: !alert.value.isConfirmed,
  title: `${alert.value.code} - ${vehicle.value?.code ?? ''}`, description: alert.value.type
}]);

onMounted(() => {
  if (!alertsStore.alertsLoaded) alertsStore.fetchAlerts();
  if (!fleetStore.vehiclesLoaded) fleetStore.fetchVehicles();
});
</script>

<template>
  <div v-if="alert">
    <div class="mb-4">
      <h1 class="sb-title">{{ t('alerts.detail-title') }}</h1>
      <p class="sb-subtitle">{{ t('alerts.detail-subtitle', { code: alert.code }) }}</p>
    </div>

    <div class="grid">
      <!-- pasos -->
      <div class="col-12 lg:col-7">
        <div class="sb-panel h-full">
          <div class="flex justify-content-between align-items-start mb-4">
            <div>
              <div class="text-lg">{{ alert.type }}</div>
              <div class="text-sm sb-muted">Señal emitida por la unidad {{ vehicle?.code ?? '—' }}</div>
            </div>
            <span v-if="alert.isConfirmed" class="sb-badge">Protocolo validado</span>
            <pv-tag v-else-if="alert.isCritical" value="FALLO CRÍTICO" severity="danger"/>
          </div>

          <div v-for="(step, index) in steps" :key="index" class="step">
            <div class="step-icon" :class="{ 'step-done': step.done, 'step-failed': step.failed }">
              <i :class="step.failed ? 'pi pi-times' : step.done ? 'pi pi-check' : 'pi pi-circle'"/>
            </div>
            <div>
              <div class="text-sm" :class="step.failed ? 'sb-danger' : 'sb-accent'">Paso {{ index + 1 }}</div>
              <div class="text-lg">{{ step.title }}</div>
              <div class="text-xs sb-muted">{{ step.detail }}</div>
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <pv-button v-if="!alert.isConfirmed" label="CONFIRMAR ALERTA" icon="pi pi-check" @click="alertsStore.confirmAlert(alert)"/>
            <pv-button v-if="!alert.isConfirmed && !alert.isCritical" label="REENVIAR" icon="pi pi-refresh" severity="secondary"
                       @click="alertsStore.resendAlert(alert)"/>
            <pv-button label="CERRAR VISTA" severity="secondary" outlined @click="router.push({ name: 'alerts-logs' })"/>
          </div>
        </div>
      </div>

      <!-- mapa -->
      <div class="col-12 lg:col-5">
        <div class="sb-panel h-full">
          <h2 class="sb-section-title">{{ t('alerts.location-title') }}</h2>
          <fleet-map :center="alert" :markers="markers" :zoom="15" height="360px"/>
          <div class="text-xs sb-muted mt-2">GPS: {{ alert.latitude }}, {{ alert.longitude }}</div>
        </div>
      </div>
    </div>
  </div>
  <p v-else-if="alertsStore.alertsLoaded" class="sb-muted">La alerta no existe o fue eliminada.</p>
</template>

<style scoped>
.step {
  display: flex;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: var(--sb-muted);
  border: 1px solid var(--sb-border);
}

.step-done {
  background: var(--sb-accent);
  border-color: var(--sb-accent);
  color: #000;
}

.step-failed {
  background: var(--sb-danger-dark);
  border-color: var(--sb-danger);
  color: var(--sb-danger);
}
</style>
