<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useFleetStore from "../../application/fleet.store.js";
import {Driver} from "../../domain/model/driver.entity.js";

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const fleetStore = useFleetStore();

// opciones de los selects
const categories = ['A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc'];
const statusOptions = [{ label: 'Activo', value: 'active' }, { label: 'Inactivo', value: 'inactive' }];

const selectedDriverId = ref(null);
const dialogVisible = ref(false);
const form = ref(new Driver({}));

const selectedDriver = computed(() => fleetStore.getDriverById(selectedDriverId.value));
const isEdit = computed(() => form.value.id !== null);

onMounted(() => {
  fleetStore.fetchAll();
});

// código del bus asignado al conductor
const vehicleCodeOf = (driver) => {
  const assignment = fleetStore.getAssignmentByDriverId(driver.id);
  return assignment ? fleetStore.getVehicleById(assignment.vehicleId)?.code : null;
};

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
  const driver = new Driver({...form.value, employeeCode: form.value.employeeCode.toUpperCase()});
  if (isEdit.value) fleetStore.updateDriver(driver); else fleetStore.addDriver(driver);
  dialogVisible.value = false;
};

// pregunta antes de eliminar
const confirmDelete = (driver) => {
  confirm.require({
    header: 'Confirmar eliminación',
    message: `¿Seguro que deseas eliminar a ${driver.fullName}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
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
      <div class="flex justify-content-between align-items-end flex-wrap gap-3 mb-3">
        <div>
          <h1 class="sb-title">{{ t('drivers.title') }}</h1>
          <p class="sb-subtitle">{{ t('drivers.subtitle', { count: fleetStore.drivers.length }) }}</p>
        </div>
        <pv-button label="NUEVO CONDUCTOR" icon="pi pi-plus" @click="openNew"/>
      </div>

      <!-- tabla de conductores -->
      <pv-data-table :value="fleetStore.drivers" :loading="!fleetStore.driversLoaded" data-key="id"
                     selection-mode="single" :selection="selectedDriver"
                     @row-select="event => selectedDriverId = event.data.id"
                     paginator :rows="8" striped-rows>
        <pv-column header="Nombre" sortable sort-field="lastName">
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
        <pv-column field="dni" header="DNI"/>
        <pv-column header="Categoría">
          <template #body="{ data }"><pv-tag :value="data.category" severity="secondary"/></template>
        </pv-column>
        <pv-column header="Vehículo">
          <template #body="{ data }">
            <span v-if="vehicleCodeOf(data)"><i class="pi pi-car mr-1"/>{{ vehicleCodeOf(data) }}</span>
            <span v-else class="sb-muted">No asignado</span>
          </template>
        </pv-column>
        <pv-column header="Estado">
          <template #body="{ data }">
            <pv-tag :value="data.isActive ? 'ACTIVO' : 'INACTIVO'" :severity="data.isActive ? 'success' : 'secondary'"/>
          </template>
        </pv-column>
        <pv-column header="Acciones">
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
                <span class="sb-dot mr-1"/>{{ selectedDriver.isActive ? 'EN SERVICIO' : 'INACTIVO' }}
              </div>
              <div class="text-xl font-semibold">{{ selectedDriver.fullName.toUpperCase() }}</div>
              <div class="text-sm sb-muted">{{ selectedDriver.yearsExperience }} años de experiencia</div>
            </div>
          </div>

          <h2 class="sb-section-title sb-muted">{{ t('drivers.detail-title') }}</h2>
          <div class="grid">
            <div class="col-6"><div class="detail-box"><div class="sb-label">Licencia</div>{{ selectedDriver.licenseNumber }}</div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">Vencimiento</div>{{ selectedDriver.licenseExpiry }}</div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">Puntos</div><span class="sb-accent">{{ selectedDriver.points }} / 15</span></div></div>
            <div class="col-6"><div class="detail-box"><div class="sb-label">Calificación</div>★ {{ selectedDriver.rating }}</div></div>
          </div>

          <div class="flex gap-2 mt-3">
            <pv-button label="HISTORIAL" icon="pi pi-history" severity="secondary" class="flex-1"
                       @click="router.push({ name: 'operations-history', query: { driverId: selectedDriver.id } })"/>
            <pv-button label="EDITAR" icon="pi pi-pencil" severity="secondary" class="flex-1" @click="openEdit(selectedDriver)"/>
          </div>
        </template>
        <p v-else class="sb-muted text-center mt-6">Selecciona un conductor de la tabla para ver su información.</p>
      </div>
    </div>
  </div>

  <!-- formulario para crear o editar -->
  <pv-dialog v-model:visible="dialogVisible" modal :header="isEdit ? t('drivers.edit-title') : t('drivers.new-title')"
             :style="{ width: '520px' }">
    <form id="driver-form" class="grid" @submit.prevent="saveDriver">
      <div class="col-6 flex flex-column gap-1">
        <label for="firstName" class="sb-label">Nombres</label>
        <pv-input-text id="firstName" v-model="form.firstName" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="lastName" class="sb-label">Apellidos</label>
        <pv-input-text id="lastName" v-model="form.lastName" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="employeeCode" class="sb-label">Código de empleado</label>
        <pv-input-text id="employeeCode" v-model="form.employeeCode" placeholder="SF-00000" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="dni" class="sb-label">DNI</label>
        <pv-input-text id="dni" v-model="form.dni" maxlength="8" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="licenseNumber" class="sb-label">N° de licencia</label>
        <pv-input-text id="licenseNumber" v-model="form.licenseNumber" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="licenseExpiry" class="sb-label">Vencimiento</label>
        <pv-input-text id="licenseExpiry" v-model="form.licenseExpiry" type="date" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="category" class="sb-label">Categoría</label>
        <pv-select id="category" v-model="form.category" :options="categories" placeholder="Selecciona"/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="status" class="sb-label">Estado</label>
        <pv-select id="status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value"/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="yearsExperience" class="sb-label">Años de experiencia</label>
        <pv-input-number id="yearsExperience" v-model="form.yearsExperience" :min="0" :max="50"/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="points" class="sb-label">Puntos</label>
        <pv-input-number id="points" v-model="form.points" :min="0" :max="15"/>
      </div>
    </form>
    <template #footer>
      <pv-button label="Cancelar" severity="secondary" @click="dialogVisible = false"/>
      <pv-button label="Guardar" icon="pi pi-save" type="submit" form="driver-form"/>
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
