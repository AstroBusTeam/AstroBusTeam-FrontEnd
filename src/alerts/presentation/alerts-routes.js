const alertLogs     = () => import('./views/alert-logs.vue');
const alertDetail   = () => import('./views/alert-detail.vue');
const notifications = () => import('./views/notifications.vue');

// rutas del módulo de alertas (/alerts/...)
const alertsRoutes = [
    { path: 'logs',     name: 'alerts-logs',   component: alertLogs,   meta: { title: 'Registro de alertas' } },
    { path: 'logs/:id', name: 'alerts-detail', component: alertDetail, meta: { title: 'Confirmación de alerta' } }
];

// esta pantalla va dentro de administración (/administration/...)
export const alertsAdministrationRoutes = [
    { path: 'notifications', name: 'alerts-notifications', component: notifications, meta: { title: 'Notificaciones' } }
];

export default alertsRoutes;
