<script setup>
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useAlertsStore from "../../application/alerts.store.js";
import useFleetStore from "../../../fleet/application/fleet.store.js";
import {MAX_ATTEMPTS} from "../../domain/model/alert.entity.js";

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const alertsStore = useAlertsStore();
const fleetStore = useFleetStore();

// texto y color de cada estado
const statusInfo = {
  pending:   { label: 'SIN RESPUESTA',  severity: 'secondary' },
  timeout:   { label: 'TIEMPO AGOTADO', severity: 'warn' },
  critical:  { label: 'FALLO CRÍTICO',  severity: 'danger' },
  confirmed: { label: 'CONFIRMADO',     severity: 'success' }
};

// las alertas se recargan siempre para ver las nuevas
onMounted(() => {
  alertsStore.fetchAlerts();
  if (!fleetStore.vehiclesLoaded) fleetStore.fetchVehicles();
});

// código del bus para la tabla
const vehicleCode = (vehicleId) => fleetStore.getVehicleById(vehicleId)?.code ?? '—';

// reenvía todas las que se puedan (el store ignora las críticas)
const resendAll = () => {
  alertsStore.unconfirmedAlerts.forEach(alert => alertsStore.resendAlert(alert));
};

// pregunta antes de eliminar
const confirmDelete = (alert) => {
  confirm.require({
    header: 'Confirmar eliminación',
    message: `¿Seguro que deseas eliminar la alerta ${alert.code}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: () => alertsStore.deleteAlert(alert)
  });
};

// las alertas críticas se pintan de rojo
const rowClass = (alert) => alert.isCritical ? 'critical-row' : '';
</script>

<template>
  <div class="flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
    <div>
      <h1 class="sb-title">{{ t('alerts.title') }}</h1>
      <p class="sb-subtitle">{{ t('alerts.subtitle') }}</p>
    </div>
    <pv-button :label="t('alerts.resend-all')" icon="pi pi-refresh" @click="resendAll"/>
  </div>

  <!-- contadores -->
  <div class="grid mb-3">
    <div class="col-12 md:col-4">
      <div class="sb-panel">
        <div class="sb-label">{{ t('alerts.pending-total') }}</div>
        <div class="text-5xl">{{ alertsStore.unconfirmedAlerts.length }}</div>
        <div class="text-xs sb-accent">{{ t('alerts.unconfirmed') }}</div>
      </div>
    </div>
    <div class="col-12 md:col-4">
      <div class="sb-panel">
        <div class="sb-label">{{ t('alerts.critical-attempt', { count: MAX_ATTEMPTS }) }}</div>
        <div class="text-5xl sb-danger">{{ String(alertsStore.criticalAlerts.length).padStart(2, '0') }}</div>
        <div class="text-xs sb-danger">{{ t('alerts.action-required') }}</div>
      </div>
    </div>
    <div class="col-12 md:col-4">
      <div class="sb-panel">
        <div class="sb-label">{{ t('alerts.confirmed-label') }}</div>
        <div class="text-5xl sb-accent">{{ alertsStore.alerts.length - alertsStore.unconfirmedAlerts.length }}</div>
        <div class="text-xs sb-muted">{{ t('alerts.by-central') }}</div>
      </div>
    </div>
  </div>

  <!-- tabla de alertas -->
  <pv-data-table :value="alertsStore.alerts" :loading="!alertsStore.alertsLoaded" :row-class="rowClass"
                 paginator :rows="8">
    <pv-column :header="t('alerts.col-time')" sortable sort-field="createdAt">
      <template #body="{ data }">{{ data.time }}</template>
    </pv-column>
    <pv-column field="code" :header="t('alerts.col-id')" sortable>
      <template #body="{ data }">#{{ data.code }}</template>
    </pv-column>
    <pv-column :header="t('common.unit')">
      <template #body="{ data }">{{ vehicleCode(data.vehicleId) }}</template>
    </pv-column>
    <pv-column field="type" :header="t('alerts.col-type')"/>
    <pv-column field="receiver" :header="t('alerts.col-receiver')"/>
    <pv-column :header="t('alerts.col-attempts')">
      <template #body="{ data }">
        <!-- en rojo cuando llegó al máximo -->
        <pv-tag :value="`${data.attempts}/${MAX_ATTEMPTS}`" :severity="data.attempts >= MAX_ATTEMPTS ? 'danger' : 'warn'"/>
      </template>
    </pv-column>
    <pv-column :header="t('common.status')">
      <template #body="{ data }">
        <pv-tag :value="statusInfo[data.status].label" :severity="statusInfo[data.status].severity"/>
      </template>
    </pv-column>
    <pv-column :header="t('common.actions')">
      <template #body="{ data }">
        <div class="flex gap-1">
          <pv-button v-tooltip.top="'Reenviar'" icon="pi pi-refresh" text rounded
                     :disabled="data.isConfirmed || data.isCritical" @click="alertsStore.resendAlert(data)"/>
          <pv-button v-tooltip.top="'Confirmar'" icon="pi pi-check" text rounded severity="success"
                     :disabled="data.isConfirmed" @click="alertsStore.confirmAlert(data)"/>
          <pv-button v-tooltip.top="'Ver detalle'" icon="pi pi-eye" text rounded severity="secondary"
                     @click="router.push({ name: 'alerts-detail', params: { id: data.id } })"/>
          <pv-button v-tooltip.top="'Eliminar'" icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)"/>
        </div>
      </template>
    </pv-column>
  </pv-data-table>
</template>

<style scoped>
:deep(.critical-row) {
  background: var(--sb-danger-dark) !important;
}
</style>
