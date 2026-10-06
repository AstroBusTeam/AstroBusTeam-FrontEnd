const controlCenter     = () => import('./views/control-center.vue');
const driverManagement  = () => import('./views/driver-management.vue');
const vehicleManagement = () => import('./views/vehicle-management.vue');
const unitAssignment    = () => import('./views/unit-assignment.vue');

// rutas del módulo de flota
const fleetRoutes = [
    { path: 'control-center', name: 'fleet-control-center', component: controlCenter,     meta: { title: 'Centro de control' } },
    { path: 'drivers',        name: 'fleet-drivers',        component: driverManagement,  meta: { title: 'Gestión de conductores' } },
    { path: 'vehicles',       name: 'fleet-vehicles',       component: vehicleManagement, meta: { title: 'Gestión de vehículos' } },
    { path: 'assignments',    name: 'fleet-assignments',    component: unitAssignment,    meta: { title: 'Asignación de unidades' } }
];

export default fleetRoutes;
