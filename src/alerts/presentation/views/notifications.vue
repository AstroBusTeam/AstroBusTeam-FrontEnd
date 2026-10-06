<script setup>
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useAlertsStore from "../../application/alerts.store.js";

const { t } = useI18n();
const toast = useToast();
const alertsStore = useAlertsStore();

// opciones del simulacro
const alertTypes = ['Fallo de infraestructura', 'Botón de pánico', 'Desvío de ruta', 'Fallo mecánico'];
const priorities = ['Baja', 'Media', 'Urgente'];
const statusInfo = {
  sent:    { label: 'ENVIADO',   severity: 'success' },
  pending: { label: 'PENDIENTE', severity: 'secondary' },
  failed:  { label: 'FALLIDO',   severity: 'danger' }
};

const alertType = ref(alertTypes[0]);
const priority = ref('Media');
const sending = ref(false);

const activeCount = computed(() => alertsStore.recipients.filter(r => r.active).length);
// mensaje de vista previa
const preview = computed(() =>
    `[ALERTA-SIM] Se reporta "${alertType.value.toUpperCase()}" con prioridad ${priority.value.toUpperCase()}. ` +
    'Requiere atención según protocolo TRANSIT-SEC.');

onMounted(() => {
  alertsStore.fetchRecipients();
  alertsStore.fetchDeliveries();
});

// envía el simulacro
const sendToAll = () => {
  sending.value = true;
  alertsStore.sendSimulation(alertType.value, priority.value).then(count => {
    toast.add({ severity: 'success', summary: 'Simulación enviada', detail: `${count} destinatarios notificados`, life: 3000 });
  }).finally(() => sending.value = false);
};
</script>

<template>
  <div class="grid">
    <!-- destinatarios -->
    <div class="col-12 lg:col-6">
      <h1 class="sb-title text-2xl">{{ t('notifications.title') }}</h1>
      <p class="sb-subtitle mb-3">{{ t('notifications.subtitle') }}</p>

      <div class="sb-panel">
        <div class="flex justify-content-between">
          <h2 class="sb-section-title sb-accent">{{ t('notifications.recipients-title') }}</h2>
          <span class="text-xs sb-muted">OPERATIVOS: {{ activeCount }}</span>
        </div>
        <div v-for="recipient in alertsStore.recipients" :key="recipient.id" class="recipient-row">
          <pv-avatar icon="pi pi-user"/>
          <div class="flex-1">
            <div>{{ recipient.name.toUpperCase() }}</div>
            <div class="text-xs sb-muted">{{ recipient.role.toUpperCase() }}</div>
          </div>
          <span class="text-xs" :class="recipient.active ? 'sb-accent' : 'sb-muted'">{{ recipient.channel }}</span>
          <pv-toggle-switch :model-value="recipient.active" @update:model-value="alertsStore.toggleRecipient(recipient)"/>
        </div>
      </div>
    </div>

    <!-- simulación de envío -->
    <div class="col-12 lg:col-6">
      <div class="sb-panel h-full flex flex-column gap-3">
        <h2 class="sb-section-title sb-accent">{{ t('notifications.simulation-title') }}</h2>
        <div class="flex flex-column gap-1">
          <label for="alertType" class="sb-label">Tipo de alerta</label>
          <pv-select id="alertType" v-model="alertType" :options="alertTypes"/>
        </div>
        <div class="flex flex-column gap-1">
          <span class="sb-label">Prioridad del mensaje</span>
          <pv-select-button v-model="priority" :options="priorities" :allow-empty="false"/>
        </div>
        <div class="preview">
          <div class="sb-label mb-1">Vista previa del mensaje</div>
          <span class="sb-accent">{{ preview }}</span>
        </div>
        <pv-button label="ENVIAR A TODOS" icon="pi pi-send" class="py-3 font-bold" :loading="sending"
                   :disabled="activeCount === 0" @click="sendToAll"/>
      </div>
    </div>

    <!-- registro de entregas -->
    <div class="col-12">
      <h2 class="sb-section-title sb-accent mt-2">{{ t('notifications.log-title') }}</h2>
      <pv-data-table :value="alertsStore.deliveries" :loading="!alertsStore.deliveriesLoaded" paginator :rows="6" striped-rows>
        <pv-column field="recipientName" header="Destinatario"/>
        <pv-column field="channel" header="Canal"/>
        <pv-column field="alertType" header="Tipo de alerta"/>
        <pv-column field="priority" header="Prioridad"/>
        <pv-column header="Fecha">
          <template #body="{ data }">{{ data.sentAt.replace('T', ' ') }}</template>
        </pv-column>
        <pv-column header="Estado">
          <template #body="{ data }">
            <pv-tag :value="statusInfo[data.status].label" :severity="statusInfo[data.status].severity"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>

<style scoped>
.recipient-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--sb-border);
}

.preview {
  padding: 1rem;
  font-size: 0.85rem;
  background: var(--sb-panel-light);
  border: 1px solid var(--sb-border);
}
</style>
