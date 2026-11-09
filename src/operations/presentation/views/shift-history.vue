<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import useOperationsStore from "../../application/operations.store.js";
import useFleetStore from "../../../fleet/application/fleet.store.js";
import {assessDriver, SPEED_LIMIT_KMH} from "../../domain/model/speed-policy.js";

const { t } = useI18n();
const route = useRoute();
const operationsStore = useOperationsStore();
const fleetStore = useFleetStore();

// meses para mostrar la fecha
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// el conductor puede venir en la url (?driverId=4)
const selectedDriverId = ref(route.query.driverId ? parseInt(route.query.driverId) : 4);
const openShiftId = ref(null);

const driver = computed(() => fleetStore.getDriverById(selectedDriverId.value));
const shifts = computed(() => operationsStore.getShiftsByDriverId(selectedDriverId.value));
// evaluación de conducta a partir de turnos, excesos e incidentes
const assessment = computed(() => assessDriver({
  rating: driver.value?.rating ?? 0,
  shifts: shifts.value
}));
// suma de incidentes de todos los turnos
const totalIncidents = computed(() => assessment.value.incidents);
const safetyScore = computed(() => assessment.value.score);
const averageSpeed = computed(() => assessment.value.averageSpeedKmh ?? '—');
const maxSpeed = computed(() => assessment.value.maxSpeedKmh);
const overspeedEvents = computed(() => assessment.value.overspeedEvents);

// etiquetas y colores del nivel de conducta
const behaviorLabels = { good: 'speed.good', regular: 'speed.regular', risk: 'speed.risk', unknown: 'speed.unknown' };
const behaviorSeverities = { good: 'success', regular: 'warn', risk: 'danger', unknown: 'secondary' };

// Loads shifts, drivers, and vehicles only when their data has not been fetched.
onMounted(() => {
  if (!operationsStore.shiftsLoaded) operationsStore.fetchShifts();
  if (!fleetStore.driversLoaded) fleetStore.fetchDrivers();
  if (!fleetStore.vehiclesLoaded) fleetStore.fetchVehicles();
});

// abrir o cerrar el detalle del turno
const toggleShift = (id) => {
  openShiftId.value = openShiftId.value === id ? null : id;
};

const vehicleCode = (vehicleId) => fleetStore.getVehicleById(vehicleId)?.code ?? '—';
// Extracts the hour and minute from a timestamp, using a fallback for missing values.
const hour = (dateTime) => dateTime ? dateTime.slice(11, 16) : '--:--';
const month = (date) => t(`months.${MONTH_KEYS[parseInt(date.slice(5, 7)) - 1]}`);
const day = (date) => date.slice(8, 10);

const statusSeverity = { active: 'info', finished: 'success', interrupted: 'danger' };
const statusLabel = { active: 'shift-status.active', finished: 'shift-status.finished', interrupted: 'shift-status.interrupted' };
</script>

<template>
  <div class="flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
    <div>
      <h1 class="sb-title">{{ t('history.title') }}</h1>
      <p class="sb-subtitle">{{ t('history.subtitle') }}</p>
    </div>
    <pv-select v-model="selectedDriverId" :options="fleetStore.drivers" option-value="id" class="w-16rem"
               :option-label="option => option.fullName" :placeholder="t('history.select-driver')"/>
  </div>

  <!-- datos del conductor -->
  <div v-if="driver" class="grid mb-3">
    <div class="col-12 md:col-6 lg:col-3">
      <div class="sb-panel flex align-items-center gap-3 h-full">
        <pv-avatar :label="driver.initials" size="xlarge"/>
        <div>
          <div class="text-lg font-semibold">{{ driver.fullName }}</div>
          <div class="text-sm sb-muted">ID: {{ driver.employeeCode }}</div>
          <pv-tag :value="t(driver.isActive ? 'common.active' : 'common.inactive').toUpperCase()" :severity="driver.isActive ? 'success' : 'secondary'"/>
          <span class="text-xs sb-muted ml-2">{{ t('history.class', { category: driver.category }) }}</span>
        </div>
      </div>
    </div>
    <div class="col-12 md:col-6 lg:col-3">
      <div class="sb-panel h-full">
        <div class="sb-label">{{ t('history.total-shifts') }}</div>
        <div class="text-5xl font-bold">{{ shifts.length }}</div>
      </div>
    </div>
    <div class="col-12 md:col-6 lg:col-3">
      <div class="sb-panel h-full">
        <div class="sb-label">{{ t('history.incidents-detected') }}</div>
        <div class="text-5xl font-bold" :class="totalIncidents > 0 ? 'sb-danger' : ''">{{ String(totalIncidents).padStart(2, '0') }}</div>
      </div>
    </div>
    <div class="col-12 md:col-6 lg:col-3">
      <div class="sb-panel h-full">
        <div class="sb-label">{{ t('history.safety-score') }}</div>
        <div class="text-5xl font-bold sb-accent">{{ safetyScore }}<span class="text-base sb-muted">/100</span></div>
        <pv-tag :value="t(behaviorLabels[assessment.level]).toUpperCase()" :severity="behaviorSeverities[assessment.level]"/>
      </div>
    </div>
    <div class="col-12 md:col-6 lg:col-3">
      <div class="sb-panel h-full">
        <div class="sb-label">{{ t('speed.average') }}</div>
        <div class="text-5xl font-bold">{{ averageSpeed }}<span class="text-base sb-muted"> km/h</span></div>
        <div class="text-xs sb-muted">{{ t('speed.limit') }}: {{ SPEED_LIMIT_KMH }} km/h</div>
      </div>
    </div>
    <div class="col-12 md:col-6 lg:col-3">
      <div class="sb-panel h-full">
        <div class="sb-label">{{ t('speed.overspeed') }}</div>
        <div class="text-5xl font-bold" :class="overspeedEvents ? 'sb-danger' : ''">{{ String(overspeedEvents).padStart(2, '0') }}</div>
        <div class="text-xs sb-muted">{{ t('speed.max') }}: {{ maxSpeed }} km/h</div>
      </div>
    </div>
  </div>

  <!-- lista de turnos -->
  <div class="flex flex-column gap-2">
    <div v-for="shift in shifts" :key="shift.id" class="sb-panel p-0">
      <div class="shift-row" @click="toggleShift(shift.id)">
        <div class="date-box" :class="{ 'sb-danger': shift.status === 'interrupted' }">
          <div class="text-xs">{{ month(shift.date) }}</div>
          <div class="text-2xl font-bold">{{ day(shift.date) }}</div>
        </div>
        <div class="flex-1">
          <div class="text-lg">{{ shift.routeName }}</div>
          <div class="text-sm sb-muted">
            <i class="pi pi-car mr-1"/>{{ vehicleCode(shift.vehicleId) }}
            <i class="pi pi-clock ml-3 mr-1"/>{{ hour(shift.startTime) }} - {{ hour(shift.endTime) }}
          </div>
        </div>
        <div class="text-center">
          <div class="sb-label">{{ t('common.passengers') }}</div>
          <div class="text-xl">{{ shift.passengers.toLocaleString() }}</div>
        </div>
        <div class="text-center">
          <div class="sb-label">{{ t('history.incidents') }}</div>
          <pv-tag :value="`${String(shift.incidents).padStart(2, '0')} ${shift.incidents ? t('history.alert') : t('history.clean')}`"
                  :severity="shift.incidents ? 'danger' : 'success'"/>
        </div>
        <i :class="openShiftId === shift.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"/>
      </div>

      <!-- detalle del turno -->
      <div v-if="openShiftId === shift.id" class="shift-detail">
        <div class="sb-label mb-2">{{ t('history.operations-log') }}</div>
        <div class="text-sm mb-1"><span class="sb-dot mr-2"/>{{ hour(shift.startTime) }} — {{ t('history.shift-start') }}</div>
        <div v-if="shift.incidents" class="text-sm mb-1"><span class="sb-dot mr-2" style="background: var(--sb-warning)"/>{{ t('history.incidents-recorded', { count: shift.incidents }) }}</div>
        <div class="text-sm mb-3"><span class="sb-dot mr-2" style="background: var(--sb-muted)"/>{{ hour(shift.endTime) }} — {{ t('history.shift-end') }}</div>
        <div class="flex flex-wrap gap-5 text-sm">
          <span>{{ t('history.route') }}: <strong>{{ shift.routeCode }}</strong></span>
          <span>{{ t('common.distance') }}: <strong>{{ shift.distanceKm }} km</strong></span>
          <span>{{ t('speed.average') }}: <strong>{{ shift.averageSpeed ?? '—' }} km/h</strong></span>
          <span>{{ t('speed.max') }}: <strong>{{ shift.hasSpeedData ? shift.maxSpeedKmh : '—' }} km/h</strong></span>
          <span>{{ t('speed.overspeed') }}: <strong :class="shift.overspeedEvents ? 'sb-danger' : ''">{{ shift.overspeedEvents }}</strong></span>
          <span>{{ t('common.revenue') }}: <strong>S/ {{ shift.revenue.toFixed(2) }}</strong></span>
          <pv-tag :value="t(statusLabel[shift.status])" :severity="statusSeverity[shift.status]"/>
        </div>
      </div>
    </div>
    <p v-if="!shifts.length" class="sb-muted">{{ t('history.no-shifts') }}</p>
  </div>
</template>

<style scoped>
.shift-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
}

.date-box {
  width: 56px;
  padding: 0.25rem;
  text-align: center;
  background: var(--sb-panel-light);
  border: 1px solid var(--sb-border);
}

.shift-detail {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--sb-border);
}
</style>
