const dashboard     = () => import('./views/dashboard.vue');
const serviceMap    = () => import('./views/service-map.vue');
const shiftHistory  = () => import('./views/shift-history.vue');
const impactNumbers = () => import('./views/impact-numbers.vue');

// rutas del módulo de operaciones (/operations/...)
const operationsRoutes = [
    { path: 'dashboard', name: 'operations-dashboard', component: dashboard,  meta: { title: 'Inicio' } },
    { path: 'map',       name: 'operations-map',       component: serviceMap, meta: { title: 'Mapa' } }
];

// estas pantallas van dentro de administración (/administration/...)
export const operationsAdministrationRoutes = [
    { path: 'history', name: 'operations-history', component: shiftHistory,  meta: { title: 'Historial de turnos' } },
    { path: 'impact',  name: 'operations-impact',  component: impactNumbers, meta: { title: 'Impacto en números' } }
];

export default operationsRoutes;
