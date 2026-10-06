<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useIamStore from "../../application/iam.store.js";
import LanguageSwitcher from "../../../shared/presentation/components/language-switcher.vue";

const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();

const employeeCode = ref('');
const verifying = ref(false);
const errorCode = ref(null);
const verifiedDriver = ref(null);
const verifiedVehicle = ref(null);
const authorized = ref(false);

// mensajes de error que se muestran
const errorMessages = {
  'invalid-code': { title: 'Código inválido', detail: 'El código no coincide con los registros actuales.' },
  'unauthorized': { title: 'Conductor no autorizado', detail: 'Su perfil no tiene permisos para operar.' },
  'no-vehicle':   { title: 'Sin vehículo asignado', detail: 'Pida a la central que le asigne una unidad.' },
  'connection':   { title: 'Sin conexión', detail: 'No se pudo conectar con el servidor (json-server).' }
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

const goToDashboard = () => {
  router.push({ name: 'operations-dashboard' });
};
</script>

<template>
  <div class="access-page">
    <header class="flex justify-content-between align-items-center px-4 py-3">
      <div class="font-bold sb-accent">SECURITYBUS | URBANGUARD</div>
      <language-switcher/>
    </header>

    <div class="access-grid">
      <!-- lado izquierdo -->
      <section class="access-hero">
        <span class="sb-badge mb-3">Estado: en espera</span>
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
          <div class="text-sm font-semibold mt-2">CÓDIGO REQUERIDO</div>
          <div class="text-xs sb-muted">Ejemplo: SF-90210</div>
        </div>

        <form class="flex flex-column gap-2" @submit.prevent="verify">
          <pv-input-text v-model="employeeCode" placeholder="Código de empleado" required/>
          <pv-button type="submit" label="VERIFICAR CREDENCIALES" icon="pi pi-shield" :loading="verifying"/>
        </form>

        <div v-if="errorCode" class="access-error mt-3">
          <i class="pi pi-times-circle mr-2"/>
          <strong>{{ errorMessages[errorCode].title }}</strong>
          <div class="text-sm">{{ errorMessages[errorCode].detail }}</div>
        </div>

        <!-- tarjeta del conductor verificado -->
        <div v-if="verifiedDriver" class="sb-panel mt-3">
          <div class="flex align-items-center gap-3">
            <pv-avatar :label="verifiedDriver.initials" size="xlarge" class="sb-avatar"/>
            <div>
              <span class="sb-badge">Identidad verificada</span>
              <div class="text-lg font-semibold mt-1">{{ verifiedDriver.fullName.toUpperCase() }}</div>
              <div class="text-sm sb-muted">ID: {{ verifiedDriver.employeeCode }}</div>
            </div>
          </div>
          <div class="flex gap-5 my-3">
            <div>
              <div class="sb-label">Placa vehículo</div>
              <div class="sb-accent">{{ verifiedVehicle.plate }}</div>
            </div>
            <div>
              <div class="sb-label">Unidad</div>
              <div class="sb-accent">{{ verifiedVehicle.code }}</div>
            </div>
            <div>
              <div class="sb-label">Estado</div>
              <div class="sb-accent">ACTIVO</div>
            </div>
          </div>
          <pv-button label="INICIAR TURNO" icon="pi pi-arrow-right" icon-pos="right" class="w-full" @click="startShift"/>
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
            <span class="sb-label">Coordenadas GPS</span>
            <span class="sb-danger">{{ verifiedVehicle.latitude }}, {{ verifiedVehicle.longitude }}</span>
          </div>
          <div class="flex justify-content-between">
            <span class="sb-label">Estado central</span>
            <span class="sb-accent">CENTRAL NOTIFICADA</span>
          </div>
        </div>
        <pv-button label="Seguir" class="authorized-button w-full" @click="goToDashboard"/>
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

@media (max-width: 800px) {
  .access-grid {
    grid-template-columns: 1fr;
  }

  .access-hero {
    min-height: 260px;
  }
}
</style>
