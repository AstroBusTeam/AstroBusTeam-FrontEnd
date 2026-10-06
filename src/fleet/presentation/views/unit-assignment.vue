<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm, useToast} from "primevue";
import useFleetStore from "../../application/fleet.store.js";
import {Assignment} from "../../domain/model/assignment.entity.js";

const { t } = useI18n();
const confirm = useConfirm();
const toast = useToast();
const fleetStore = useFleetStore();

const selectedDriverId = ref(null);
const selectedVehicleId = ref(null);
const routeName = ref('');

// solo se puede confirmar si hay conductor, bus y ruta
const canConfirm = computed(() => selectedDriverId.value && selectedVehicleId.value && routeName.value.trim());

onMounted(() => {
  fleetStore.fetchAll();
});

// crea la asignación
const confirmAssignment = () => {
  const now = new Date();
  const assignment = new Assignment({
    driverId: selectedDriverId.value,
    vehicleId: selectedVehicleId.value,
    route: routeName.value.trim(),
    startTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  });
  fleetStore.addAssignment(assignment);
  toast.add({ severity: 'success', summary: 'Asignación confirmada', detail: assignment.route, life: 3000 });
  selectedDriverId.value = null;
  selectedVehicleId.value = null;
  routeName.value = '';
};

// termina la asignación
const confirmRelease = (assignment) => {
  confirm.require({
    header: 'Liberar unidad',
    message: '¿Deseas terminar esta asignación? El vehículo quedará disponible.',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Liberar',
    rejectLabel: 'Cancelar',
    accept: () => fleetStore.deleteAssignment(assignment)
  });
};

const driverName = (id) => fleetStore.getDriverById(id)?.fullName ?? '—';
const vehicleText = (id) => {
  const vehicle = fleetStore.getVehicleById(id);
  return vehicle ? `${vehicle.code} (${vehicle.plate})` : '—';
};
</script>

<template>
  <div class="mb-4">
    <h1 class="sb-title text-4xl">{{ t('assignments.title') }}</h1>
    <p class="sb-subtitle">{{ t('assignments.subtitle') }}</p>
  </div>

  <div class="grid mb-4">
    <!-- conductores disponibles -->
    <div class="col-12 lg:col-4">
      <div class="sb-panel h-full">
        <div class="flex justify-content-between">
          <h2 class="sb-section-title">{{ t('assignments.drivers-title') }}</h2>
          <span class="text-xs sb-accent">{{ fleetStore.availableDrivers.length }} TOTAL</span>
        </div>
        <div class="flex flex-column gap-2">
          <div v-for="driver in fleetStore.availableDrivers" :key="driver.id" class="pick-item"
               :class="{ 'pick-item-selected': selectedDriverId === driver.id }" @click="selectedDriverId = driver.id">
            <pv-avatar :label="driver.initials"/>
            <div class="flex-1">
              <div class="font-semibold">{{ driver.fullName.toUpperCase() }}</div>
              <div class="text-xs sb-muted">ID: {{ driver.employeeCode }} · CAT: {{ driver.category }}</div>
            </div>
            <i v-if="selectedDriverId === driver.id" class="pi pi-check-circle sb-accent"/>
          </div>
          <p v-if="!fleetStore.availableDrivers.length" class="sb-muted text-sm">No hay conductores libres.</p>
        </div>
      </div>
    </div>

    <!-- ruta y botón para confirmar -->
    <div class="col-12 lg:col-4 flex flex-column justify-content-center gap-3">
      <div class="sb-panel text-center">
        <i class="pi pi-arrow-right-arrow-left text-3xl sb-accent"/>
        <h2 class="sb-section-title sb-muted mt-3">{{ t('assignments.link-title') }}</h2>
        <pv-input-text v-model="routeName" placeholder="Ruta asignada (ej. Norte-Centro L1)" class="w-full"/>
      </div>
      <pv-button label="CONFIRMAR ASIGNACIÓN" icon="pi pi-check-circle" class="py-3 font-bold" :disabled="!canConfirm"
                 @click="confirmAssignment"/>
    </div>

    <!-- vehículos disponibles -->
    <div class="col-12 lg:col-4">
      <div class="sb-panel h-full">
        <div class="flex justify-content-between">
          <h2 class="sb-section-title">{{ t('assignments.vehicles-title') }}</h2>
          <span class="text-xs sb-accent">{{ fleetStore.availableVehicles.length }} TOTAL</span>
        </div>
        <div class="flex flex-column gap-2">
          <div v-for="vehicle in fleetStore.availableVehicles" :key="vehicle.id" class="pick-item"
               :class="{ 'pick-item-selected': selectedVehicleId === vehicle.id }" @click="selectedVehicleId = vehicle.id">
            <span class="text-2xl">🚌</span>
            <div class="flex-1">
              <div class="font-semibold">{{ vehicle.code }} · {{ vehicle.model.toUpperCase() }}</div>
              <div class="text-xs sb-muted">PLACA: {{ vehicle.plate }} · CAP: {{ vehicle.capacity }} PAX</div>
            </div>
            <i v-if="selectedVehicleId === vehicle.id" class="pi pi-check-circle sb-accent"/>
          </div>
          <p v-if="!fleetStore.availableVehicles.length" class="sb-muted text-sm">No hay vehículos disponibles.</p>
        </div>
      </div>
    </div>
  </div>

  <h2 class="sb-section-title">{{ t('assignments.current-title') }}</h2>
  <!-- asignaciones actuales -->
  <pv-data-table :value="fleetStore.activeAssignments" :loading="!fleetStore.assignmentsLoaded" striped-rows>
    <pv-column header="Conductor">
      <template #body="{ data }">{{ driverName(data.driverId) }}</template>
    </pv-column>
    <pv-column header="Vehículo (placa)">
      <template #body="{ data }">{{ vehicleText(data.vehicleId) }}</template>
    </pv-column>
    <pv-column field="route" header="Ruta asignada"/>
    <pv-column field="startTime" header="Hora inicio"/>
    <pv-column header="Estado">
      <template #body><pv-tag value="EN CURSO" severity="success"/></template>
    </pv-column>
    <pv-column header="Acciones">
      <template #body="{ data }">
        <pv-button label="Liberar" icon="pi pi-times" text severity="danger" @click="confirmRelease(data)"/>
      </template>
    </pv-column>
  </pv-data-table>
</template>

<style scoped>
.pick-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--sb-panel-light);
  border: 1px solid var(--sb-border);
  cursor: pointer;
}

.pick-item-selected {
  border-color: var(--sb-accent);
}
</style>
