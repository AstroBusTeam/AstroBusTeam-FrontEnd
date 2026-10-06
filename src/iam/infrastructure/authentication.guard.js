import useIamStore from "../application/iam.store.js";

export function authenticationGuard(to) {
    const iamStore = useIamStore();
    if (to.meta['public'] || iamStore.isSignedIn) return true;
    return { name: 'iam-identity-verification' };
}
