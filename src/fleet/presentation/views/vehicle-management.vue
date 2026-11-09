<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue";
import useFleetStore from "../../application/fleet.store.js";
import {Vehicle} from "../../domain/model/vehicle.entity.js";

// Initializes translation, confirmation dialog, and fleet state services.
const { t } = useI18n();
const confirm = useConfirm();
const fleetStore = useFleetStore();

// estados del bus
const statusOptions = computed(() => [
  { label: t('vehicle-status.available'),   value: 'available',   severity: 'success' },
  { label: t('vehicle-status.in-service'),  value: 'in-service',  severity: 'info' },
  { label: t('vehicle-status.maintenance'), value: 'maintenance', severity: 'warn' }
]);

// estado del formulario
const dialogVisible = ref(false);
const form = ref(new Vehicle({}));
// Determines whether the vehicle form is editing an existing record.
const isEdit = computed(() => form.value.id !== null);

// solo se piden los buses si todavía no están cargados
onMounted(() => {
  if (!fleetStore.vehiclesLoaded) fleetStore.fetchVehicles();
});

// opción de estado (texto y color) para la etiqueta
const statusOf = (value) => statusOptions.value.find(option => option.value === value);

// abrir el formulario vacío
const openNew = () => {
  form.value = new Vehicle({});
  dialogVisible.value = true;
};

// abrir el formulario con los datos del bus
const openEdit = (vehicle) => {
  form.value = new Vehicle({...vehicle});
  dialogVisible.value = true;
};

// si tiene id se actualiza, si no se crea
const saveVehicle = () => {
  // placa y código siempre en mayúsculas
  const vehicle = new Vehicle({...form.value, plate: form.value.plate.toUpperCase(), code: form.value.code.toUpperCase()});
  if (isEdit.value) fleetStore.updateVehicle(vehicle); else fleetStore.addVehicle(vehicle);
  dialogVisible.value = false;
};

// pregunta antes de eliminar
const confirmDelete = (vehicle) => {
  confirm.require({
    header: t('common.confirm-delete'),
    message: t('vehicles.delete-message', { code: vehicle.code }),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    accept: () => fleetStore.deleteVehicle(vehicle)
  });
};
</script>

<template>
  <!-- Displays the vehicle management title, total vehicle count, and registration button. -->
  <div class="flex justify-content-between align-items-end flex-wrap gap-3 mb-3">
    <div>
      <h1 class="sb-title">{{ t('vehicles.title') }}</h1>
      <p class="sb-subtitle">{{ t('vehicles.subtitle', { count: fleetStore.vehicles.length }) }}</p>
    </div>
    <pv-button :label="t('vehicles.new-vehicle')" icon="pi pi-plus" @click="openNew"/>
  </div>

  <!-- tabla de vehículos -->
  <pv-data-table :value="fleetStore.vehicles" :loading="!fleetStore.vehiclesLoaded" paginator :rows="8" striped-rows>
    <pv-column field="code" :header="t('common.unit')" sortable>
      <template #body="{ data }"><span class="font-semibold">🚌 {{ data.code }}</span></template>
    </pv-column>
    <pv-column field="plate" :header="t('common.plate')" sortable/>
    <pv-column field="model" :header="t('vehicles.model')" sortable/>
    <pv-column field="capacity" :header="t('vehicles.capacity')" sortable>
      <template #body="{ data }">{{ data.capacity }} PAX</template>
    </pv-column>
    <pv-column field="status" :header="t('common.status')" sortable>
      <template #body="{ data }">
        <pv-tag :value="statusOf(data.status)?.label.toUpperCase()" :severity="statusOf(data.status)?.severity"/>
      </template>
    </pv-column>
    <pv-column :header="t('common.actions')">
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
        <label for="code" class="sb-label">{{ t('vehicles.unit-code') }}</label>
        <pv-input-text id="code" v-model="form.code" placeholder="BUS-0000" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="plate" class="sb-label">{{ t('common.plate') }}</label>
        <pv-input-text id="plate" v-model="form.plate" placeholder="ABC-123" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="model" class="sb-label">{{ t('vehicles.model') }}</label>
        <pv-input-text id="model" v-model="form.model" required/>
      </div>
      <div class="col-6 flex flex-column gap-1">
        <label for="capacity" class="sb-label">{{ t('vehicles.capacity-passengers') }}</label>
        <pv-input-number id="capacity" v-model="form.capacity" :min="1" :max="120"/>
      </div>
      <div class="col-12 flex flex-column gap-1">
        <label for="status" class="sb-label">{{ t('common.status') }}</label>
        <pv-select id="status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value"/>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" @click="dialogVisible = false"/>
      <pv-button :label="t('common.save')" icon="pi pi-save" type="submit" form="vehicle-form"/>
    </template>
  </pv-dialog>
</template>
