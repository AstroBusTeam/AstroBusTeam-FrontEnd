<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue";
import useFleetStore from "../../application/fleet.store.js";
import {Vehicle} from "../../domain/model/vehicle.entity.js";

const { t } = useI18n();
const confirm = useConfirm();
const fleetStore = useFleetStore();

// estados del bus
const statusOptions = [
  { label: 'Disponible',    value: 'available',   severity: 'success' },
  { label: 'En servicio',   value: 'in-service',  severity: 'info' },
  { label: 'Mantenimiento', value: 'maintenance', severity: 'warn' }
];

const dialogVisible = ref(false);
const form = ref(new Vehicle({}));
const isEdit = computed(() => form.value.id !== null);

onMounted(() => {
  if (!fleetStore.vehiclesLoaded) fleetStore.fetchVehicles();
});

const statusOf = (value) => statusOptions.find(option => option.value === value);

const openNew = () => {
  form.value = new Vehicle({});
  dialogVisible.value = true;
};

const openEdit = (vehicle) => {
  form.value = new Vehicle({...vehicle});
  dialogVisible.value = true;
};

// si tiene id se actualiza, si no se crea
const saveVehicle = () => {
  const vehicle = new Vehicle({...form.value, plate: form.value.plate.toUpperCase(), code: form.value.code.toUpperCase()});
  if (isEdit.value) fleetStore.updateVehicle(vehicle); else fleetStore.addVehicle(vehicle);
  dialogVisible.value = false;
};

// pregunta antes de eliminar
const confirmDelete = (vehicle) => {
  confirm.require({
    header: 'Confirmar eliminación',
    message: `¿Seguro que deseas eliminar la unidad ${vehicle.code}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: () => fleetStore.deleteVehicle(vehicle)
  });
};
</script>

<template>
  <div class="flex justify-content-between align-items-end flex-wrap gap-3 mb-3">
    <div>
      <h1 class="sb-title">{{ t('vehicles.title') }}</h1>
      <p class="sb-subtitle">{{ t('vehicles.subtitle', { count: fleetStore.vehicles.length }) }}</p>
    </div>
    <pv-button label="NUEVO VEHÍCULO" icon="pi pi-plus" @click="openNew"/>
  </div>

  <!-- tabla de vehículos -->
  <pv-data-table :value="fleetStore.vehicles" :loading="!fleetStore.vehiclesLoaded" paginator :rows="8" striped-rows>
    <pv-column field="code" header="Unidad" sortable>
      <template #body="{ data }"><span class="font-semibold">🚌 {{ data.code }}</span></template>
    </pv-column>
    <pv-column field="plate" header="Placa" sortable/>
    <pv-column field="model" header="Modelo" sortable/>
    <pv-column field="capacity" header="Capacidad" sortable>
      <template #body="{ data }">{{ data.capacity }} PAX</template>
    </pv-column>
    <pv-column field="status" header="Estado" sortable>
      <template #body="{ data }">
        <pv-tag :value="statusOf(data.status)?.label.toUpperCase()" :severity="statusOf(data.status)?.severity"/>
      </template>
    </pv-column>
    <pv-column header="Acciones">
      <template #body="{ data }">
        <pv-button icon="pi pi-pencil" text rounded @click="openEdit(data)"/>
        <pv-button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)"/>
      </template>
    </pv-column>
  </pv-data-table>

  <!-- formulario para crear o editar -->
  <pv-dialog v-model:visible="dialogVisible" modal :header="isEdit ? t('vehicles.edit-title') : t('vehicles.new-title')"
             :style="{ width: '480px' }">
    <form id="vehicle-form" class="grid" @submit.prevent="saveVehicle">
      <div class="col-6 flex flex-column gap-1">
        <label for="code" class="sb-label">Código de unidad</label>
        <pv-input-text id="code" v-model="form.code" placeholder="BUS-0000" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="plate" class="sb-label">Placa</label>
        <pv-input-text id="plate" v-model="form.plate" placeholder="ABC-123" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="model" class="sb-label">Modelo</label>
        <pv-input-text id="model" v-model="form.model" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="capacity" class="sb-label">Capacidad (pasajeros)</label>
        <pv-input-number id="capacity" v-model="form.capacity" :min="1" :max="120"/>
      </div>
      <div class="col-12 flex flex-column gap-1">
        <label for="status" class="sb-label">Estado</label>
        <pv-select id="status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value"/>
      </div>
    </form>
    <template #footer>
      <pv-button label="Cancelar" severity="secondary" @click="dialogVisible = false"/>
      <pv-button label="Guardar" icon="pi pi-save" type="submit" form="vehicle-form"/>
    </template>
  </pv-dialog>
</template>
