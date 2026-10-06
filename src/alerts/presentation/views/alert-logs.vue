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

onMounted(() => {
  alertsStore.fetchAlerts();
  if (!fleetStore.vehiclesLoaded) fleetStore.fetchVehicles();
});

const vehicleCode = (vehicleId) => fleetStore.getVehicleById(vehicleId)?.code ?? '—';

// reenvía todas las que se puedan
const resendAll = () => {
  alertsStore.unconfirmedAlerts.forEach(alert => alertsStore.resendAlert(alert));
};

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
    <pv-button label="REENVIAR TODOS" icon="pi pi-refresh" @click="resendAll"/>
  </div>

  <!-- contadores -->
  <div class="grid mb-3">
    <div class="col-12 md:col-4">
      <div class="sb-panel">
        <div class="sb-label">Pendientes totales</div>
        <div class="text-5xl">{{ alertsStore.unconfirmedAlerts.length }}</div>
        <div class="text-xs sb-accent">ALERTAS SIN CONFIRMAR</div>
      </div>
    </div>
    <div class="col-12 md:col-4">
      <div class="sb-panel">
        <div class="sb-label">Críticos ({{ MAX_ATTEMPTS }}er intento)</div>
        <div class="text-5xl sb-danger">{{ String(alertsStore.criticalAlerts.length).padStart(2, '0') }}</div>
        <div class="text-xs sb-danger">ACCIÓN REQUERIDA</div>
      </div>
    </div>
    <div class="col-12 md:col-4">
      <div class="sb-panel">
        <div class="sb-label">Confirmadas</div>
        <div class="text-5xl sb-accent">{{ alertsStore.alerts.length - alertsStore.unconfirmedAlerts.length }}</div>
        <div class="text-xs sb-muted">POR LA CENTRAL</div>
      </div>
    </div>
  </div>

  <!-- tabla de alertas -->
  <pv-data-table :value="alertsStore.alerts" :loading="!alertsStore.alertsLoaded" :row-class="rowClass"
                 paginator :rows="8">
    <pv-column header="Hora" sortable sort-field="createdAt">
      <template #body="{ data }">{{ data.time }}</template>
    </pv-column>
    <pv-column field="code" header="ID alerta" sortable>
      <template #body="{ data }">#{{ data.code }}</template>
    </pv-column>
    <pv-column header="Unidad">
      <template #body="{ data }">{{ vehicleCode(data.vehicleId) }}</template>
    </pv-column>
    <pv-column field="type" header="Tipo"/>
    <pv-column field="receiver" header="Receptor"/>
    <pv-column header="Intentos">
      <template #body="{ data }">
        <pv-tag :value="`${data.attempts}/${MAX_ATTEMPTS}`" :severity="data.attempts >= MAX_ATTEMPTS ? 'danger' : 'warn'"/>
      </template>
    </pv-column>
    <pv-column header="Estado">
      <template #body="{ data }">
        <pv-tag :value="statusInfo[data.status].label" :severity="statusInfo[data.status].severity"/>
      </template>
    </pv-column>
    <pv-column header="Acciones">
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
