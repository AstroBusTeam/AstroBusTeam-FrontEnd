import useIamStore from "../application/iam.store.js";

// solo deja entrar a las páginas públicas o si el conductor ya inició sesión
export function authenticationGuard(to) {
    const iamStore = useIamStore();
    if (to.meta['public'] || iamStore.isSignedIn) return true;
    // sin sesión lo mandamos a la pantalla de acceso
    return { name: 'iam-identity-verification' };
}
