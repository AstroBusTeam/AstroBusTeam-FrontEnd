const identityVerification = () => import('./views/identity-verification.vue');

const iamRoutes = [
    { path: 'identity-verification', name: 'iam-identity-verification', component: identityVerification, meta: { title: 'Acceso conductor', public: true } }
];

export default iamRoutes;
