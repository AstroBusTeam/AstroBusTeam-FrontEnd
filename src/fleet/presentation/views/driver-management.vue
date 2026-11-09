<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useFleetStore from "../../application/fleet.store.js";
import {Driver} from "../../domain/model/driver.entity.js";
import useOperationsStore from "../../../operations/application/operations.store.js";
import {assessDriver} from "../../../operations/domain/model/speed-policy.js";

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const fleetStore = useFleetStore();
const operationsStore = useOperationsStore();

// opciones de los selects
const categories = ['A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc'];
// Genera las opciones de estado del conductor utilizando las traducciones del idioma actual.
const statusOptions = computed(() => [
  { label: t('common.active'), value: 'active' },
  { label: t('common.inactive'), value: 'inactive' }
]);

// conductor elegido en la tabla
const selectedDriverId = ref(null);
// estado del formulario
const dialogVisible = ref(false);
const form = ref(new Driver({}));

// Obtiene el conductor seleccionado y determina si el formulario está en modo edición.
const selectedDriver = computed(() => fleetStore.getDriverById(selectedDriverId.value));
const isEdit = computed(() => form.value.id !== null);

// los turnos se usan para evaluar la conducta
onMounted(() => {
  fleetStore.fetchAll();
  if (!operationsStore.shiftsLoaded) operationsStore.fetchShifts();
});

// código del bus asignado al conductor
const vehicleCodeOf = (driver) => {
  const assignment = fleetStore.getAssignmentByDriverId(driver.id);
  return assignment ? fleetStore.getVehicleById(assignment.vehicleId)?.code : null;
};

// evaluación de conducta del conductor según sus turnos
const assessmentOf = (driver) => assessDriver({
  rating: driver.rating,
  shifts: operationsStore.getShiftsByDriverId(driver.id)
});
// texto y color de la etiqueta según el nivel
const behaviorLabels = { good: 'speed.good', regular: 'speed.regular', risk: 'speed.risk', unknown: 'speed.unknown' };
const behaviorSeverities = { good: 'success', regular: 'warn', risk: 'danger', unknown: 'secondary' };
const behaviorLabel = (driver) => t(behaviorLabels[assessmentOf(driver).level]).toUpperCase();
const behaviorSeverity = (driver) => behaviorSeverities[assessmentOf(driver).level];

// abrir el formulario vacío
const openNew = () => {
  form.value = new Driver({});
  dialogVisible.value = true;
};

// abrir el formulario con los datos del conductor
const openEdit = (driver) => {
  form.value = new Driver({...driver});
  dialogVisible.value = true;
};

// si tiene id se actualiza, si no se crea
const saveDriver = () => {
  // el código de empleado siempre se guarda en mayúsculas
  const driver = new Driver({...form.value, employeeCode: form.value.employeeCode.toUpperCase()});
  if (isEdit.value) fleetStore.updateDriver(driver); else fleetStore.addDriver(driver);
  dialogVisible.value = false;
};

// pregunta antes de eliminar
const confirmDelete = (driver) => {
  confirm.require({
    header: t('common.confirm-delete'),
    message: t('drivers.delete-message', { name: driver.fullName }),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    accept: () => {
      fleetStore.deleteDriver(driver);
      selectedDriverId.value = null;
    }
  });
};
</script>

<template>
  <div class="grid">
    <div class="col-12 xl:col-8">
      <!-- título y botón para agregar -->
      <div class="flex justify-content-between align-items-end flex-wrap gap-3 mb-3">
        <div>
          <h1 class="sb-title">{{ t('drivers.title') }}</h1>
          <p class="sb-subtitle">{{ t('drivers.subtitle', { count: fleetStore.drivers.length }) }}</p>
        </div>
        <pv-button :label="t('drivers.new-driver')" icon="pi pi-plus" @click="openNew"/>
      </div>

      <!-- tabla de conductores -->
      <pv-data-table :value="fleetStore.drivers" :loading="!fleetStore.driversLoaded" data-key="id"
                     selection-mode="single" :selection="selectedDriver"
                     @row-select="event => selectedDriverId = event.data.id"
                     paginator :rows="8" striped-rows>
        <pv-column :header="t('drivers.name')" sortable sort-field="lastName">
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <pv-avatar :label="data.initials"/>
              <div>
                <div class="font-semibold">{{ data.fullName }}</div>
                <div class="text-xs sb-muted">{{ data.employeeCode }}</div>
              </div>
            </div>
          </template>
        </pv-column>
        <pv-column field="dni" :header="t('drivers.dni')"/>
        <pv-column :header="t('drivers.category')">
          <template #body="{ data }"><pv-tag :value="data.category" severity="secondary"/></template>
        </pv-column>
        <pv-column :header="t('drivers.vehicle')">
          <template #body="{ data }">
            <span v-if="vehicleCodeOf(data)"><i class="pi pi-car mr-1"/>{{ vehicleCodeOf(data) }}</span>
            <span v-else class="sb-muted">{{ t('drivers.not-assigned') }}</span>
          </template>
        </pv-column>
        <pv-column :header="t('common.status')">
          <template #body="{ data }">
            <pv-tag :value="t(data.isActive ? 'common.active' : 'common.inactive').toUpperCase()" :severity="data.isActive ? 'success' : 'secondary'"/>
          </template>
        </pv-column>
        <pv-column :header="t('drivers.behavior')">
          <template #body="{ data }">
            <pv-tag :value="behaviorLabel(data)" :severity="behaviorSeverity(data)"/>
          </template>
        </pv-column>
        <pv-column :header="t('common.actions')">
          <template #body="{ data }">
            <pv-button icon="pi pi-pencil" text rounded @click.stop="openEdit(data)"/>
            <pv-button icon="pi pi-trash" text rounded severity="danger" @click.stop="confirmDelete(data)"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <!-- detalle del conductor seleccionado -->
    <div class="col-12 xl:col-4">
      <div class="sb-panel h-full">
        <template v-if="selectedDriver">
          <div class="flex align-items-center gap-3 mb-4">
            <pv-avatar :label="selectedDriver.initials" size="xlarge"/>
            <div>
              <div class="text-xs" :class="selectedDriver.isActive ? 'sb-accent' : 'sb-muted'">
                <span class="sb-dot mr-1"/>{{ selectedDriver.isActive ? t('drivers.in-service') : t('common.inactive').toUpperCase() }}
              </div>
              <div class="text-xl font-semibold">{{ selectedDriver.fullName.toUpperCase() }}</div>
              <div class="text-sm sb-muted">{{ t('drivers.years-experience-text', { years: selectedDriver.yearsExperience }) }}</div>
            </div>
          </div>

          <h2 class="sb-section-title sb-muted">{{ t('drivers.detail-title') }}</h2>
          <div class="grid">
            <div class="col-6"><div class="detail-box"><div class="sb-label">{{ t('drivers.license') }}</div>{{ selectedDriver.licenseNumber }}</div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">{{ t('drivers.expiry') }}</div>{{ selectedDriver.licenseExpiry }}</div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">{{ t('drivers.points') }}</div><span class="sb-accent">{{ selectedDriver.points }} / 15</span></div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">{{ t('drivers.rating') }}</div>★ {{ selectedDriver.rating }}</div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">{{ t('speed.average') }}</div>{{ assessmentOf(selectedDriver).averageSpeedKmh ?? '—' }} km/h</div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">{{ t('speed.overspeed') }}</div><span :class="assessmentOf(selectedDriver).overspeedEvents ? 'sb-danger' : 'sb-accent'">{{ assessmentOf(selectedDriver).overspeedEvents }}</span></div></div>
          </div>
          <pv-tag :value="behaviorLabel(selectedDriver)" :severity="behaviorSeverity(selectedDriver)" class="mt-3"/>

          <!-- ver sus turnos o editarlo -->
          <div class="flex gap-2 mt-3">
            <pv-button :label="t('drivers.history')" icon="pi pi-history" severity="secondary" class="flex-1"
                       @click="router.push({ name: 'operations-history', query: { driverId: selectedDriver.id } })"/>
            <pv-button :label="t('drivers.edit')" icon="pi pi-pencil" severity="secondary" class="flex-1" @click="openEdit(selectedDriver)"/>
          </div>
        </template>
        <p v-else class="sb-muted text-center mt-6">{{ t('drivers.select-prompt') }}</p>
      </div>
    </div>
  </div>

  <!-- formulario para crear o editar -->
  <pv-dialog v-model:visible="dialogVisible" modal :header="isEdit ? t('drivers.edit-title') : t('drivers.new-title')"
             :style="{ width: '520px' }">
    <form id="driver-form" class="grid" @submit.prevent="saveDriver">
      <div class="col-6 flex flex-column gap-1">
        <label for="firstName" class="sb-label">{{ t('drivers.first-name') }}</label>
        <pv-input-text id="firstName" v-model="form.firstName" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="lastName" class="sb-label">{{ t('drivers.last-name') }}</label>
        <pv-input-text id="lastName" v-model="form.lastName" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="employeeCode" class="sb-label">{{ t('drivers.employee-code') }}</label>
        <pv-input-text id="employeeCode" v-model="form.employeeCode" placeholder="SF-00000" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="dni" class="sb-label">{{ t('drivers.dni') }}</label>
        <pv-input-text id="dni" v-model="form.dni" maxlength="8" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="licenseNumber" class="sb-label">{{ t('drivers.license-number') }}</label>
        <pv-input-text id="licenseNumber" v-model="form.licenseNumber" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="licenseExpiry" class="sb-label">{{ t('drivers.expiry') }}</label>
        <pv-input-text id="licenseExpiry" v-model="form.licenseExpiry" type="date" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="category" class="sb-label">{{ t('drivers.category') }}</label>
        <pv-select id="category" v-model="form.category" :options="categories" :placeholder="t('drivers.select')"/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="status" class="sb-label">{{ t('common.status') }}</label>
        <pv-select id="status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value"/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="yearsExperience" class="sb-label">{{ t('drivers.years-experience') }}</label>
        <pv-input-number id="yearsExperience" v-model="form.yearsExperience" :min="0" :max="50"/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="points" class="sb-label">{{ t('drivers.points') }}</label>
        <pv-input-number id="points" v-model="form.points" :min="0" :max="15"/>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" @click="dialogVisible = false"/>
      <pv-button :label="t('common.save')" icon="pi pi-save" type="submit" form="driver-form"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.detail-box {
  height: 100%;
  padding: 0.75rem;
  background: var(--sb-panel-light);
  border: 1px solid var(--sb-border);
}
</style>
