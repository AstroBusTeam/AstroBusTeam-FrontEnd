import {createRouter, createWebHistory} from "vue-router";
import iamRoutes from "./iam/presentation/iam-routes.js";
import operationsRoutes from "./operations/presentation/operations-routes.js";
import fleetRoutes from "./fleet/presentation/fleet-routes.js";
import alertsRoutes from "./alerts/presentation/alerts-routes.js";
import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";

// página para las rutas que no existen
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

// rutas de la app, cada módulo tiene sus propias rutas
const routes = [
    { path: '/iam',             name: 'iam',        children: iamRoutes },
    { path: '/operations',      name: 'operations', children: operationsRoutes },
    { path: '/fleet',           name: 'fleet',      children: fleetRoutes },
    { path: '/alerts',          name: 'alerts',     children: alertsRoutes },
    { path: '/home',            redirect: '/operations/dashboard' },
    { path: '/',                redirect: '/operations/dashboard' },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'Página no encontrada' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
});

// antes de cambiar de página ponemos el título y revisamos si hay sesión
router.beforeEach((to) => {
    document.title = `SafeBus - ${to.meta['title']}`;
    return authenticationGuard(to);
});

export default router;
