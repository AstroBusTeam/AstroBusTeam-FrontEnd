<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm, useToast} from "primevue";
import useOperationsStore from "../../application/operations.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import FleetMap from "../../../shared/presentation/components/fleet-map.vue";

const { t } = useI18n();
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const operationsStore = useOperationsStore();
const iamStore = useIamStore();

const now = ref(new Date());
let clock = null;
const finishedDialogVisible = ref(false);
// puntos del protocolo de cierre
const checklist = ref([
  { label: 'Vehículo estacionado en zona segura / terminal', done: false },
  { label: 'Verificación de interior sin objetos perdidos', done: false },
  { label: 'Validación de total de pasajeros en consola', done: false }
]);

const vehicle = computed(() => iamStore.currentVehicle);
// turno que se muestra en el dashboard
const shift = computed(() => operationsStore.getCurrentShift(iamStore.currentDriver.id));
const isProtocolComplete = computed(() => checklist.value.every(item => item.done));
const vehicleMarkers = computed(() => [{
  id: vehicle.value.id, latitude: vehicle.value.latitude, longitude: vehicle.value.longitude,
  label: vehicle.value.code, title: vehicle.value.code, description: `Placa ${vehicle.value.plate}`
}]);

onMounted(() => {
  if (!operationsStore.shiftsLoaded) operationsStore.fetchShifts();
  // el reloj se actualiza cada segundo
  clock = setInterval(() => now.value = new Date(), 1000);
});

onUnmounted(() => clearInterval(clock));

// si el servicio está activo empieza la simulación
watch(() => shift.value?.isActive, isActive => {
  if (isActive) operationsStore.startTracking(iamStore.currentDriver.id);
}, { immediate: true });

// finalizar servicio
const confirmFinish = () => {
  // primero hay que marcar el protocolo de cierre
  if (!isProtocolComplete.value) {
    toast.add({ severity: 'warn', summary: 'Protocolo de cierre incompleto',
      detail: 'Marca los 3 puntos del protocolo de cierre antes de finalizar.', life: 3500 });
    return;
  }
  confirm.require({
    header: 'Finalizar servicio',
    message: '¿Seguro que deseas finalizar el servicio? Esta acción no puede deshacerse.',
    icon: 'pi pi-power-off',
    acceptLabel: 'Finalizar',
    rejectLabel: 'Cancelar',
    accept: () => {
      operationsStore.finishShift(shift.value).then(() => {
        checklist.value.forEach(item => item.done = false);
        finishedDialogVisible.value = true;
      });
    }
  });
};

// iniciar otro servicio en la misma ruta
const startNewService = () => {
  operationsStore.startShift({
    driverId: iamStore.currentDriver.id,
    vehicleId: vehicle.value.id,
    routeCode: shift.value?.routeCode ?? 'R-01',
    routeName: shift.value?.routeName ?? 'Ruta asignada'
  });
};

// salir: primero cambiamos de página y después borramos la sesión
const signOut = () => {
  operationsStore.stopTracking();
  router.push({ name: 'iam-identity-verification' }).then(() => iamStore.signOut());
};
</script>

<template>
  <div class="grid">
    <div class="col-12 lg:col-8 flex flex-column gap-3">
      <!-- datos del servicio -->
      <section class="sb-panel">
        <template v-if="shift">
          <h2 class="sb-section-title">{{ shift.isActive ? t('dashboard.service-title') : t('dashboard.summary-title') }}</h2>
          <div class="grid">
            <div class="col-6 xl:col-3">
              <div class="sb-label">Distancia</div>
              <div class="sb-value">{{ shift.distanceKm.toFixed(2) }} KM</div>
            </div>
            <div class="col-6 xl:col-3">
              <div class="sb-label">Tiempo total</div>
              <div class="sb-value">{{ shift.getDuration(now) }}</div>
            </div>
            <div class="col-6 xl:col-3">
              <div class="sb-label">Pasajeros</div>
              <div class="sb-value">{{ shift.passengers }}</div>
            </div>
            <div class="col-6 xl:col-3">
              <div class="sb-label">Recaudación</div>
              <div class="sb-value">S/ {{ shift.revenue.toFixed(2) }}</div>
            </div>
          </div>

          <!-- ruta -->
          <h3 class="sb-section-title mt-4">{{ t('dashboard.route-title') }}</h3>
          <div class="route-box">
            <span class="route-code">{{ shift.routeCode }}</span>
            <div class="flex-1">
              <div class="font-semibold">{{ shift.routeName }}</div>
              <div class="text-xs sb-muted">Unidad {{ vehicle.code }} · Placa {{ vehicle.plate }}</div>
            </div>
            <pv-button v-if="shift.isActive" label="VER MAPA" icon="pi pi-map" @click="router.push('/operations/map')"/>
            <pv-button v-else label="INICIAR NUEVO SERVICIO" icon="pi pi-play" @click="startNewService"/>
          </div>
        </template>

        <template v-else>
          <h2 class="sb-section-title">{{ t('dashboard.no-service-title') }}</h2>
          <p class="sb-subtitle mb-3">{{ t('dashboard.no-service-subtitle') }}</p>
          <pv-button label="INICIAR SERVICIO" icon="pi pi-play" @click="startNewService"/>
        </template>
      </section>

      <!-- protocolo de cierre -->
      <section class="sb-panel">
        <h2 class="sb-section-title">{{ t('dashboard.protocol-title') }}</h2>
        <div class="flex flex-column gap-2">
          <label v-for="(item, index) in checklist" :key="index" class="check-row">
            <pv-checkbox v-model="item.done" binary :disabled="!shift?.isActive"/>
            <span>{{ item.label }}</span>
          </label>
        </div>
      </section>
    </div>

    <div class="col-12 lg:col-4 flex flex-column gap-3">
      <!-- botón de finalizar -->
      <section class="sb-panel text-center">
        <i class="pi pi-power-off text-5xl sb-accent"/>
        <h2 class="sb-section-title mt-3 sb-muted">{{ t('dashboard.confirmation-title') }}</h2>
        <pv-button label="FINALIZAR SERVICIO" class="w-full py-3 font-bold" :disabled="!shift?.isActive"
                   @click="confirmFinish"/>
        <div class="text-xs mt-2" :class="shift?.isActive ? 'sb-accent' : 'sb-muted'">
          <template v-if="shift?.isActive"><span class="sb-dot mr-1"/>Servicio en curso · datos actualizándose</template>
          <template v-else>Servicio detenido · datos guardados</template>
        </div>
      </section>

      <section class="sb-panel">
        <h2 class="sb-section-title">{{ t('dashboard.system-title') }}</h2>
        <div class="flex justify-content-between text-sm mb-2"><span class="sb-muted">GPS</span><span class="sb-accent">ESTABLE</span></div>
        <div class="flex justify-content-between text-sm mb-2"><span class="sb-muted">TELEMETRÍA</span><span class="sb-accent">SINCRO</span></div>
        <div class="flex justify-content-between text-sm"><span class="sb-muted">RED CLOUD</span><span class="sb-accent">ACTIVA</span></div>
      </section>

      <!-- mapa pequeño con el bus -->
      <fleet-map :center="vehicle" :markers="vehicleMarkers" :zoom="14" height="240px"/>
    </div>
  </div>

  <!-- diálogo cuando termina el servicio -->
  <pv-dialog v-model:visible="finishedDialogVisible" modal :closable="false" :style="{ width: '420px' }">
    <div class="text-center">
      <i class="pi pi-check-square text-6xl sb-accent"/>
      <h2 class="text-xl uppercase mt-3 mb-2">{{ t('dashboard.finished-title') }}</h2>
      <p class="sb-subtitle mb-4">{{ t('dashboard.finished-subtitle') }}</p>
      <div class="flex gap-2">
        <pv-button label="VER REPORTE" severity="secondary" class="flex-1" @click="finishedDialogVisible = false"/>
        <pv-button label="SALIR" class="flex-1" @click="signOut"/>
      </div>
    </div>
  </pv-dialog>
</template>

<style scoped>
.route-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--sb-panel-light);
}

.route-code {
  padding: 0.5rem 0.75rem;
  font-weight: 700;
  background: var(--sb-accent);
  color: #000;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--sb-panel-light);
  cursor: pointer;
}
</style>
