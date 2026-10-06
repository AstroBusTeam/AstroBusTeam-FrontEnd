import {computed, reactive, ref} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {Driver} from "../../fleet/domain/model/driver.entity.js";
import {Vehicle} from "../../fleet/domain/model/vehicle.entity.js";

const iamApi = new IamApi();
// nombre con el que se guarda la sesión en el navegador
const SESSION_KEY = 'safebus-session';

// lee la sesión guardada para no perderla al recargar
function readSavedSession() {
    try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
        return saved ? { driver: new Driver(saved.driver), vehicle: new Vehicle(saved.vehicle) } : null;
    } catch {
        return null;
    }
}

function createIamStore() {
    const savedSession = readSavedSession();
    const currentDriver = ref(savedSession?.driver ?? null);
    const currentVehicle = ref(savedSession?.vehicle ?? null);
    const isSignedIn = computed(() => currentDriver.value !== null);

    // revisa el código del empleado en la base de datos
    async function verifyEmployeeCode(employeeCode) {
        try {
            const driversResponse = await iamApi.getDriversByEmployeeCode(employeeCode.trim().toUpperCase());
            // el código no existe
            if (driversResponse.data.length === 0) return { error: 'invalid-code' };

            const driver = new Driver(driversResponse.data[0]);
            // el conductor está inactivo
            if (!driver.isActive) return { error: 'unauthorized' };

            const assignmentsResponse = await iamApi.getActiveAssignments(driver.id);
            if (assignmentsResponse.data.length === 0) return { error: 'no-vehicle' };

            const vehicleResponse = await iamApi.getVehicleById(assignmentsResponse.data[0].vehicleId);
            return { driver, vehicle: new Vehicle(vehicleResponse.data) };
        } catch (error) {
            console.error(error);
            return { error: 'connection' };
        }
    }

    // guarda el conductor y su bus
    function signIn(driver, vehicle) {
        currentDriver.value = driver;
        currentVehicle.value = vehicle;
        localStorage.setItem(SESSION_KEY, JSON.stringify({ driver, vehicle }));
    }

    // borra la sesión
    function signOut() {
        currentDriver.value = null;
        currentVehicle.value = null;
        localStorage.removeItem(SESSION_KEY);
    }

    return reactive({ currentDriver, currentVehicle, isSignedIn, verifyEmployeeCode, signIn, signOut });
}

// el store se crea una sola vez y todos los componentes lo comparten
let iamStore = null;

const useIamStore = () => {
    if (iamStore === null) iamStore = createIamStore();
    return iamStore;
};

export default useIamStore;
