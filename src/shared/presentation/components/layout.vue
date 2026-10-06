<script setup>
import {computed} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import LanguageSwitcher from "./language-switcher.vue";
import FooterContent from "./footer-content.vue";
import PanicButton from "../../../alerts/presentation/components/panic-button.vue";
import useIamStore from "../../../iam/application/iam.store.js";
import useOperationsStore from "../../../operations/application/operations.store.js";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();
const operationsStore = useOperationsStore();

// la página de login se muestra sin menú ni toolbar
const isPublicPage = computed(() => route.meta['public'] === true);

// opciones del menú (label es la clave de traducción)
const operationItems = [
  { label: 'menu.dashboard', icon: 'pi pi-th-large', to: '/operations/dashboard' },
  { label: 'menu.map',       icon: 'pi pi-map',      to: '/operations/map' }
];

const administrationItems = [
  { label: 'menu.control-center', to: '/administration/control-center' },
  { label: 'menu.drivers',        to: '/administration/drivers' },
  { label: 'menu.vehicles',       to: '/administration/vehicles' },
  { label: 'menu.assignments',    to: '/administration/assignments' },
  { label: 'menu.notifications',  to: '/administration/notifications' },
  { label: 'menu.history',        to: '/administration/history' },
  { label: 'menu.impact',         to: '/administration/impact' }
];

// cerrar sesión: primero salimos de la página y después borramos la sesión
const signOut = () => {
  operationsStore.stopTracking();
  router.push({ name: 'iam-identity-verification' }).then(() => iamStore.signOut());
};
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>

  <router-view v-if="isPublicPage"/>

  <div v-else-if="route.name" class="sb-shell">
    <!-- menú lateral -->
    <aside class="sb-sidebar">
      <div class="px-3 pt-3 pb-4">
        <div class="text-xl font-bold sb-accent">SafeBus</div>
        <div class="text-xs sb-muted">{{ iamStore.currentDriver?.employeeCode }}</div>
      </div>

      <nav class="flex-1">
        <router-link v-for="item in operationItems" :key="item.to" :to="item.to" class="sb-nav-link">
          <i :class="item.icon"/> {{ t(item.label) }}
        </router-link>

        <div class="sb-nav-link sb-nav-group" :class="{ 'sb-nav-group-active': route.path.startsWith('/administration') }">
          <i class="pi pi-shield"/> {{ t('menu.administration') }}
        </div>
        <router-link v-for="item in administrationItems" :key="item.to" :to="item.to" class="sb-nav-link sb-nav-sublink">
          {{ t(item.label) }}
        </router-link>

        <router-link to="/alerts/logs" class="sb-nav-link">
          <i class="pi pi-exclamation-triangle"/> {{ t('menu.alert-logs') }}
        </router-link>
      </nav>

      <button class="sb-nav-link sb-signout" @click="signOut">
        <i class="pi pi-sign-out"/> {{ t('menu.sign-out') }}
      </button>
    </aside>

    <div class="sb-content">
      <!-- toolbar con el idioma y el botón de pánico -->
      <pv-toolbar class="sb-toolbar">
        <template #start>
          <span class="sb-accent font-semibold text-sm mr-3">{{ t('toolbar.monitor') }}</span>
          <span class="sb-muted">|</span>
          <span class="ml-3 text-sm uppercase">{{ t('toolbar.unit') }}: {{ iamStore.currentVehicle?.code }}</span>
        </template>
        <template #end>
          <div class="flex align-items-center gap-4">
            <language-switcher/>
            <span class="text-sm"><i class="pi pi-user mr-1"/>{{ iamStore.currentDriver?.fullName }}</span>
            <span class="sb-badge">{{ t('toolbar.status') }}</span>
            <panic-button/>
          </div>
        </template>
      </pv-toolbar>

      <!-- aquí se muestra la página actual -->
      <main class="sb-main">
        <router-view/>
      </main>

      <footer-content/>
    </div>
  </div>
</template>

<style scoped>
.sb-shell {
  display: flex;
  min-height: 100vh;
}

.sb-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100vh;
  flex-shrink: 0;
  background: #0f0f0f;
  border-right: 1px solid var(--sb-border);
  overflow-y: auto;
}

.sb-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sb-muted);
  border: none;
  border-left: 3px solid transparent;
  background: none;
  cursor: pointer;
  text-align: left;
}

.sb-nav-link:hover {
  color: var(--sb-text);
}

.sb-nav-link.router-link-active {
  color: var(--sb-accent);
  background: var(--sb-panel);
  border-left-color: var(--sb-accent);
}

.sb-nav-group {
  cursor: default;
}

.sb-nav-group-active {
  color: var(--sb-accent);
}

.sb-nav-sublink {
  padding: 0.45rem 1rem 0.45rem 2.5rem;
  font-size: 0.68rem;
}

.sb-signout {
  border-top: 1px solid var(--sb-border);
  padding: 1rem;
}

.sb-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.sb-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  border: none;
  border-bottom: 1px solid var(--sb-border);
  border-radius: 0;
  background: #0f0f0f;
  padding: 0.6rem 1.5rem;
}

.sb-main {
  flex: 1;
  padding: 1.5rem;
}
</style>
