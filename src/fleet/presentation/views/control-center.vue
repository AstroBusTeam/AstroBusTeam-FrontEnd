<script setup>
import {computed, onMounted} from "vue";
import {useI18n} from "vue-i18n";
import useFleetStore from "../../application/fleet.store.js";
import useAlertsStore from "../../../alerts/application/alerts.store.js";
import FleetMap from "../../../shared/presentation/components/fleet-map.vue";

const { t } = useI18n();
const fleetStore = useFleetStore();
const alertsStore = useAlertsStore();

// centro del mapa (Lima)
const LIMA_CENTER = { latitude: -12.0490, longitude: -77.0450 };
const statusLabel = { 'available': 'Disponible', 'in-service': 'En servicio', 'maintenance': 'Mantenimiento' };

onMounted(() => {
  fleetStore.fetchAll();
  alertsStore.fetchAlerts();
});

// un marcador por bus, en rojo si tiene una alerta
const markers = computed(() => fleetStore.vehicles.map(vehicle => {
  const alert = alertsStore.unconfirmedAlerts.find(a => a.vehicleId === vehicle.id);
  const assignment = fleetStore.getAssignmentByVehicleId(vehicle.id);
  const driver = assignment ? fleetStore.getDriverById(assignment.driverId) : null;
  return {
    id: vehicle.id,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    label: vehicle.code,
    danger: !!alert,
    title: alert ? `Unidad ${vehicle.code} - SOS` : `Unidad ${vehicle.code}`,
    description: alert
        ? `${alert.type} · ${assignment?.route ?? ''}`
        : `${driver ? driver.fullName : 'Sin conductor'} · ${statusLabel[vehicle.status]}`,
    link: alert ? `/alerts/logs/${alert.id}` : null
  };
}));

const vehiclesInService = computed(() => fleetStore.vehicles.filter(v => v.status === 'in-service').length);
</script>

<template>
  <div class="mb-3">
    <h1 class="sb-title">{{ t('control-center.title') }}</h1>
    <p class="sb-subtitle">{{ t('control-center.subtitle') }}</p>
  </div>

  <div class="flex gap-5 mb-3 text-sm">
    <span><span class="sb-dot mr-2"/>{{ fleetStore.vehicles.length }} UNIDADES</span>
    <span><span class="sb-dot mr-2"/>{{ vehiclesInService }} EN SERVICIO</span>
    <span class="sb-danger"><span class="sb-dot mr-2" style="background: var(--sb-danger)"/>{{ alertsStore.unconfirmedAlerts.length }} ALERTAS ACTIVAS</span>
  </div>

  <fleet-map :center="LIMA_CENTER" :markers="markers" :zoom="14" height="620px"/>
</template>
