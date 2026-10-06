import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from "./i18n.js";
// PrimeVue y nuestro tema
import PrimeVue from 'primevue/config';
import SafeBusTheme from "./safebus-theme.js";
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip';
import {
    Avatar,
    Button,
    Checkbox,
    Column,
    ConfirmationService,
    ConfirmDialog,
    DataTable,
    Dialog,
    InputNumber,
    InputText,
    Select,
    SelectButton,
    Tag,
    Toast,
    ToastService,
    ToggleSwitch,
    Toolbar
} from "primevue";
// rutas de la app
import router from "./router.js";

// la licencia de PrimeVue está en el archivo .env
const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

// creamos la app y le agregamos idiomas, PrimeVue y el router
createApp(App)
    .use(i18n)
    .use(PrimeVue, {theme: { preset: SafeBusTheme, options: { darkModeSelector: '.app-dark' }}, ripple: true, license: primeUiLicenseKey})
    .use(ConfirmationService)
    .use(ToastService)
    // registramos los componentes de PrimeVue con el prefijo pv-
    .component('pv-avatar',         Avatar)
    .component('pv-button',         Button)
    .component('pv-checkbox',       Checkbox)
    .component('pv-column',         Column)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-data-table',     DataTable)
    .component('pv-dialog',         Dialog)
    .component('pv-input-number',   InputNumber)
    .component('pv-input-text',     InputText)
    .component('pv-select',         Select)
    .component('pv-select-button',  SelectButton)
    .component('pv-tag',            Tag)
    .component('pv-toast',          Toast)
    .component('pv-toggle-switch',  ToggleSwitch)
    .component('pv-toolbar',        Toolbar)
    .directive('tooltip',           Tooltip)
    .use(router)
    .mount('#app')
