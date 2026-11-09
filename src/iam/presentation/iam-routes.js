// la vista se carga solo cuando se necesita
const identityVerification = () => import('./views/identity-verification.vue');

// rutas de acceso, son públicas porque todavía no hay sesión
const iamRoutes = [
    { path: 'identity-verification', name: 'iam-identity-verification', component: identityVerification, meta: { title: 'Acceso conductor', public: true } }
];

export default iamRoutes;
