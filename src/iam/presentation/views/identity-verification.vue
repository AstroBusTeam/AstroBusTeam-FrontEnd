<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useIamStore from "../../application/iam.store.js";
import LanguageSwitcher from "../../../shared/presentation/components/language-switcher.vue";

const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();

// estado del formulario
const employeeCode = ref('');
const verifying = ref(false);
const errorCode = ref(null);
// conductor y bus que se encontraron con el código
const verifiedDriver = ref(null);
const verifiedVehicle = ref(null);
// muestra la pantalla de acceso autorizado
const authorized = ref(false);

// mensajes de error que se muestran (claves de traducción)
const errorMessages = {
  'invalid-code': { title: 'iam.errors.invalid-code-title', detail: 'iam.errors.invalid-code-detail' },
  'unauthorized': { title: 'iam.errors.unauthorized-title', detail: 'iam.errors.unauthorized-detail' },
  'no-vehicle':   { title: 'iam.errors.no-vehicle-title',   detail: 'iam.errors.no-vehicle-detail' },
  'connection':   { title: 'iam.errors.connection-title',   detail: 'iam.errors.connection-detail' }
};

// verificar el código
const verify = async () => {
  verifying.value = true;
  errorCode.value = null;
  verifiedDriver.value = null;
  const result = await iamStore.verifyEmployeeCode(employeeCode.value);
  verifying.value = false;
  if (result.error) {
    errorCode.value = result.error;
    return;
  }
  verifiedDriver.value = result.driver;
  verifiedVehicle.value = result.vehicle;
};

// inicia sesión y muestra la pantalla verde
const startShift = () => {
  iamStore.signIn(verifiedDriver.value, verifiedVehicle.value);
  authorized.value = true;
};

// después de autorizar pasamos al panel principal
const goToDashboard = () => {
  router.push({ name: 'operations-dashboard' });
};
</script>

<template>
  <div class="access-page">
    <!-- encabezado con el logo y el cambio de idioma -->
    <header class="flex justify-content-between align-items-center px-4 py-3">
      <div class="font-bold sb-accent">SECURITYBUS | URBANGUARD</div>
      <language-switcher/>
    </header>

    <div class="access-grid">
      <!-- lado izquierdo -->
      <section class="access-hero">
        <span class="sb-badge mb-3">{{ t('iam.status-waiting') }}</span>
        <h1 class="access-hero-title">{{ t('iam.hero-title') }}</h1>
        <p class="sb-muted m-0">{{ t('iam.hero-subtitle') }}</p>
      </section>

      <!-- formulario -->
      <section class="p-5">
        <div class="text-xl font-bold sb-accent">SecurityBus</div>
        <h2 class="text-2xl font-medium mt-1 mb-0">{{ t('iam.title') }}</h2>
        <p class="sb-subtitle mb-4">{{ t('iam.subtitle') }}</p>

        <div class="access-qr mb-3">
          <i class="pi pi-qrcode text-5xl sb-accent"/>
          <div class="text-sm font-semibold mt-2">{{ t('iam.code-required') }}</div>
          <div class="text-xs sb-muted">{{ t('iam.code-example') }}</div>
        </div>

        <!-- ingreso del código de empleado -->
        <form class="flex flex-column gap-2" @submit.prevent="verify">
          <pv-input-text v-model="employeeCode" :placeholder="t('iam.code-placeholder')" required/>
          <pv-button type="submit" :label="t('iam.verify')" icon="pi pi-shield" :loading="verifying"/>
        </form>

        <!-- error de la verificación -->
        <div v-if="errorCode" class="access-error mt-3">
          <i class="pi pi-times-circle mr-2"/>
          <strong>{{ t(errorMessages[errorCode].title) }}</strong>
          <div class="text-sm">{{ t(errorMessages[errorCode].detail) }}</div>
        </div>

        <!-- tarjeta del conductor verificado -->
        <div v-if="verifiedDriver" class="sb-panel mt-3">
          <div class="flex align-items-center gap-3">
            <pv-avatar :label="verifiedDriver.initials" size="xlarge" class="sb-avatar"/>
            <div>
              <span class="sb-badge">{{ t('iam.verified') }}</span>
              <div class="text-lg font-semibold mt-1">{{ verifiedDriver.fullName.toUpperCase() }}</div>
              <div class="text-sm sb-muted">ID: {{ verifiedDriver.employeeCode }}</div>
            </div>
          </div>
          <!-- datos del bus asignado -->
          <div class="flex gap-5 my-3">
            <div>
              <div class="sb-label">{{ t('iam.vehicle-plate') }}</div>
              <div class="sb-accent">{{ verifiedVehicle.plate }}</div>
            </div>
            <div>
              <div class="sb-label">{{ t('common.unit') }}</div>
              <div class="sb-accent">{{ verifiedVehicle.code }}</div>
            </div>
            <div>
              <div class="sb-label">{{ t('common.status') }}</div>
              <div class="sb-accent">{{ t('iam.status-active') }}</div>
            </div>
          </div>
          <pv-button :label="t('iam.start-shift')" icon="pi pi-arrow-right" icon-pos="right" class="w-full" @click="startShift"/>
        </div>
      </section>
    </div>

    <!-- pantalla verde de acceso autorizado -->
    <div v-if="authorized" class="authorized-overlay">
      <div class="authorized-card">
        <div class="authorized-icon"><i class="pi pi-check"/></div>
        <h2 class="authorized-title">{{ t('iam.authorized-title') }}</h2>
        <p class="sb-label mb-4">{{ t('iam.authorized-subtitle') }}</p>
        <div class="authorized-info">
          <div class="flex justify-content-between">
            <span class="sb-label">{{ t('common.gps') }}</span>
            <span class="sb-danger">{{ verifiedVehicle.latitude }}, {{ verifiedVehicle.longitude }}</span>
          </div>
          <div class="flex justify-content-between">
            <span class="sb-label">{{ t('common.central-status') }}</span>
            <span class="sb-accent">{{ t('common.central-notified') }}</span>
          </div>
        </div>
        <pv-button :label="t('iam.continue')" class="authorized-button w-full" @click="goToDashboard"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.access-page {
  min-height: 100vh;
  background: var(--sb-bg);
}

.access-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1100px;
  margin: 0 auto;
  border: 1px solid var(--sb-border);
}

/* imagen de fondo hecha solo con degradados */
.access-hero {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  min-height: 520px;
  padding: 2.5rem;
  background:
      linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.2)),
      repeating-linear-gradient(90deg, #2a2a2a 0 40px, #1d1d1d 40px 80px);
}

.access-hero-title {
  margin: 0 0 0.75rem;
  font-size: 2.5rem;
  line-height: 1.1;
}

.access-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: var(--sb-panel);
  border: 1px solid var(--sb-border);
}

.access-error {
  padding: 0.75rem;
  color: #ff8a80;
  background: var(--sb-danger-dark);
  border: 1px solid var(--sb-danger);
}

.sb-avatar {
  background: var(--sb-accent-dark);
  color: var(--sb-accent);
  border: 2px solid var(--sb-accent);
}

/* pantalla verde que cubre toda la app */
.authorized-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, #8affb6 0%, var(--sb-success) 45%);
}

.authorized-card {
  width: 360px;
  max-width: calc(100% - 32px);
  padding: 2rem;
  text-align: center;
  background: #0a0a0a;
  border: 2px solid #fff;
  border-radius: 6px;
}

.authorized-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 1.5rem;
  color: #fff;
  background: #9be22d;
  border: 2px solid #fff;
  border-radius: 6px;
}

.authorized-title {
  margin: 1rem 0 0.25rem;
  font-size: 1.8rem;
  font-style: italic;
  font-weight: 800;
}

.authorized-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  border: 1px solid var(--sb-border);
}

.authorized-button.p-button {
  background: #fff;
  border-color: #fff;
  color: #000;
  font-weight: 700;
}

/* en pantallas chicas el formulario va debajo de la imagen */
@media (max-width: 800px) {
  .access-grid {
    grid-template-columns: 1fr;
  }

  .access-hero {
    min-height: 260px;
  }
}
</style>
