<script setup>
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import useOperationsStore from "../../application/operations.store.js";
import useAlertsStore from "../../../alerts/application/alerts.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import FleetMap from "../../../shared/presentation/components/fleet-map.vue";

const { t } = useI18n();
const operationsStore = useOperationsStore();
const alertsStore = useAlertsStore();
const iamStore = useIamStore();

const now = ref(new Date());
let clock = null;

const vehicle = computed(() => iamStore.currentVehicle);
const shift = computed(() => operationsStore.getCurrentShift(iamStore.currentDriver.id));

// mi bus y las alertas sin confirmar
const markers = computed(() => [
  {
    id: `vehicle-${vehicle.value.id}`, latitude: vehicle.value.latitude, longitude: vehicle.value.longitude,
    label: vehicle.value.code, title: `Unidad ${vehicle.value.code}`, description: `Placa ${vehicle.value.plate} · Tu unidad`
  },
  ...alertsStore.unconfirmedAlerts.map(alert => ({
    id: `alert-${alert.id}`, latitude: alert.latitude, longitude: alert.longitude, danger: true,
    title: `${alert.code} - SOS`, description: `${alert.type} · ${alert.time}`, link: `/alerts/logs/${alert.id}`
  }))
]);

onMounted(() => {
  if (!operationsStore.shiftsLoaded) operationsStore.fetchShifts();
  if (!alertsStore.alertsLoaded) alertsStore.fetchAlerts();
  clock = setInterval(() => now.value = new Date(), 1000);
});

onUnmounted(() => clearInterval(clock));
</script>

<template>
  <div class="mb-3">
    <h1 class="sb-title">{{ t('service-map.title') }}</h1>
    <p class="sb-subtitle">{{ t('service-map.subtitle') }}</p>
  </div>

  <div class="grid">
    <div class="col-12 lg:col-9">
      <fleet-map :center="vehicle" :markers="markers" :zoom="15" height="620px"/>
    </div>
    <div class="col-12 lg:col-3 flex flex-column gap-4">
      <div>
        <div class="sb-label">Tiempo total</div>
        <div class="sb-value">{{ shift ? shift.getDuration(now) : '--:--:--' }}</div>
      </div>
      <div>
        <div class="sb-label">Distancia</div>
        <div class="sb-value">{{ shift ? shift.distanceKm.toFixed(2) : 0 }} KM</div>
      </div>
      <div>
        <div class="sb-label">Alertas activas</div>
        <div class="sb-value sb-danger">{{ alertsStore.unconfirmedAlerts.length }}</div>
      </div>
      <p class="text-xs sb-muted m-0">Haz clic en un marcador para ver su información.</p>
    </div>
  </div>
</template>
