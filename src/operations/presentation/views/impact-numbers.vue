<script setup>
import {computed, onMounted} from "vue";
import {useI18n} from "vue-i18n";
import useOperationsStore from "../../application/operations.store.js";
import useFleetStore from "../../../fleet/application/fleet.store.js";
import useAlertsStore from "../../../alerts/application/alerts.store.js";

const { t } = useI18n();
const operationsStore = useOperationsStore();
const fleetStore = useFleetStore();
const alertsStore = useAlertsStore();

onMounted(() => {
  if (!operationsStore.shiftsLoaded) operationsStore.fetchShifts();
  if (!fleetStore.driversLoaded) fleetStore.fetchDrivers();
  if (!fleetStore.vehiclesLoaded) fleetStore.fetchVehicles();
  if (!alertsStore.alertsLoaded) alertsStore.fetchAlerts();
});

// total de pasajeros de todos los turnos
const totalPassengers = computed(() => operationsStore.shifts.reduce((sum, shift) => sum + shift.passengers, 0));

// tarjetas con los números
const cards = computed(() => [
  { label: 'Conductores verificados', icon: 'pi pi-shield', value: fleetStore.drivers.filter(d => d.isActive).length,
    detail: `${fleetStore.drivers.length} registrados` },
  { label: 'Alertas gestionadas', icon: 'pi pi-bell', value: alertsStore.alerts.length,
    detail: `${alertsStore.alerts.filter(a => a.isConfirmed).length} confirmadas` },
  { label: 'Pasajeros transportados', icon: 'pi pi-users', value: totalPassengers.value.toLocaleString(),
    detail: `${operationsStore.shifts.length} turnos` },
  { label: 'Unidades en servicio', icon: 'pi pi-car', value: fleetStore.vehicles.filter(v => v.status === 'in-service').length,
    detail: `${fleetStore.vehicles.length} buses en la flota` }
]);

// barras del gráfico (hechas con css)
const passengerBars = computed(() => {
  const list = [...operationsStore.shifts].sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(-8);
  const max = Math.max(1, ...list.map(shift => shift.passengers));
  return list.map(shift => ({ label: shift.date.slice(5), value: shift.passengers, height: shift.passengers / max * 100 }));
});

// alertas por estado
const alertBars = computed(() => {
  const statuses = [
    { key: 'pending', label: 'PENDIENTE' }, { key: 'timeout', label: 'AGOTADO' },
    { key: 'critical', label: 'CRÍTICO' }, { key: 'confirmed', label: 'CONFIRMADO' }
  ];
  const counts = statuses.map(status => alertsStore.alerts.filter(a => a.status === status.key).length);
  const max = Math.max(1, ...counts);
  return statuses.map((status, index) => ({ label: status.label, value: counts[index], height: counts[index] / max * 100,
    danger: status.key === 'critical' }));
});
</script>

<template>
  <div class="mb-4">
    <div class="sb-label sb-accent mb-1">— Analítica de seguridad</div>
    <h1 class="sb-title">{{ t('impact.title') }}</h1>
    <p class="sb-subtitle">{{ t('impact.subtitle') }}</p>
  </div>

  <div class="grid mb-3">
    <div v-for="card in cards" :key="card.label" class="col-12 md:col-6">
      <div class="sb-panel impact-card">
        <div class="flex justify-content-between">
          <div class="sb-label">{{ card.label }}</div>
          <i :class="card.icon" class="impact-icon"/>
        </div>
        <div class="text-6xl my-2">{{ card.value }}</div>
        <div class="text-xs sb-muted">{{ card.detail }}</div>
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="col-12 lg:col-7">
      <div class="sb-panel">
        <h2 class="sb-section-title">{{ t('impact.passengers-chart-title') }}</h2>
        <!-- gráfico de barras -->
        <div class="chart">
          <div v-for="bar in passengerBars" :key="bar.label" class="chart-column">
            <span class="text-xs">{{ bar.value }}</span>
            <div class="chart-track"><div class="chart-bar" :style="{ height: `${bar.height}%` }"/></div>
            <span class="text-xs sb-muted">{{ bar.label }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="col-12 lg:col-5">
      <div class="sb-panel">
        <h2 class="sb-section-title">{{ t('impact.alerts-chart-title') }}</h2>
        <div class="chart">
          <div v-for="bar in alertBars" :key="bar.label" class="chart-column">
            <span class="text-xs">{{ bar.value }}</span>
            <div class="chart-track">
              <div class="chart-bar" :class="{ 'chart-bar-danger': bar.danger }" :style="{ height: `${bar.height}%` }"/>
            </div>
            <span class="text-xs sb-muted">{{ bar.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.impact-card {
  border-color: var(--sb-accent);
}

.impact-icon {
  padding: 0.6rem;
  background: var(--sb-panel-light);
  border: 1px solid var(--sb-border);
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  height: 240px;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  flex: 1;
  height: 100%;
}

.chart-track {
  display: flex;
  align-items: flex-end;
  flex: 1;
  width: 100%;
}

.chart-bar {
  width: 100%;
  min-height: 2px;
  background: var(--sb-accent);
}

.chart-bar-danger {
  background: #ffb4a8;
}
</style>
