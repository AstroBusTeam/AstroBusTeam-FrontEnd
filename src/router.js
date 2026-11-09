import {createRouter, createWebHistory} from "vue-router";
import iamRoutes from "./iam/presentation/iam-routes.js";
import operationsRoutes, {operationsAdministrationRoutes} from "./operations/presentation/operations-routes.js";
import fleetRoutes from "./fleet/presentation/fleet-routes.js";
import alertsRoutes, {alertsAdministrationRoutes} from "./alerts/presentation/alerts-routes.js";
import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";

// página para las rutas que no existen
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

// las opciones del menú de administración juntan rutas de varios módulos
const administrationRoutes = [...fleetRoutes, ...alertsAdministrationRoutes, ...operationsAdministrationRoutes];

// rutas de la app, cada módulo tiene sus propias rutas
const routes = [
    { path: '/iam',             name: 'iam',            children: iamRoutes },
    { path: '/operations',      name: 'operations',     children: operationsRoutes },
    { path: '/administration',  name: 'administration', children: administrationRoutes },
    { path: '/alerts',          name: 'alerts',         children: alertsRoutes },
    // Both /home and the root path redirect to the operations dashboard.
    { path: '/home',            redirect: '/operations/dashboard' },
    { path: '/',                redirect: '/operations/dashboard' },
    // Catch-all route: any unknown path shows the page not found view.
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'Página no encontrada' } }
];

// Creates the router in history mode, using the base URL configured in Vite.
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
});

// antes de cambiar de página ponemos el título y revisamos si hay sesión
router.beforeEach((to) => {
    document.title = `SecurityBus - ${to.meta['title']}`;
    // The authentication guard sends the user to the login when there is no active session.
    return authenticationGuard(to);
});

export default router;
