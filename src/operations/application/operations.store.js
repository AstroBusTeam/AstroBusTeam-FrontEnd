import {reactive, ref} from "vue";
import {OperationsApi} from "../infrastructure/operations-api.js";
import {ShiftAssembler} from "../infrastructure/shift.assembler.js";

const operationsApi = new OperationsApi();

// datos para simular el avance del bus
const TRACKING_INTERVAL_MS = 5000;
const KM_PER_TICK = 0.05;
const FARE = 1.5;

// fecha y hora actual como texto
function nowAsText() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19);
}

function createOperationsStore() {
    // datos del store
    const shifts = ref([]);
    const errors = ref([]);
    const shiftsLoaded = ref(false);

    function fetchShifts() {
        operationsApi.getShifts().then(response => {
            shifts.value = ShiftAssembler.toEntitiesFromResponse(response);
            shiftsLoaded.value = true;
        }).catch(error => errors.value.push(error));
    }

    // turnos de un conductor, el más nuevo primero
    function getShiftsByDriverId(driverId) {
        return shifts.value
            .filter(shift => shift.driverId === driverId)
            .sort((a, b) => b.startTime.localeCompare(a.startTime));
    }

    // el turno activo, o si no hay, el último que terminó
    function getCurrentShift(driverId) {
        const driverShifts = getShiftsByDriverId(driverId);
        return driverShifts.find(shift => shift.isActive) ?? driverShifts[0];
    }

    // empezar un servicio nuevo desde 0
    function startShift(data) {
        const startTime = nowAsText();
        const shift = {
            ...data, date: startTime.slice(0, 10), startTime, endTime: null,
            distanceKm: 0, passengers: 0, revenue: 0, incidents: 0, status: 'active'
        };
        operationsApi.createShift(shift).then(response => {
            shifts.value = [...shifts.value, ShiftAssembler.toEntityFromResource(response.data)];
        }).catch(error => errors.value.push(error));
    }

    // guarda el turno en db.json
    function saveShift(shift) {
        return operationsApi.updateShift(shift).then(response => {
            const updated = ShiftAssembler.toEntityFromResource(response.data);
            shifts.value = shifts.value.map(s => s.id === updated.id ? updated : s);
        }).catch(error => errors.value.push(error));
    }

    let trackingTimer = null;
    let trackedDriverId = null;
    let lastProgressRequest = Promise.resolve();

    // cada 5 segundos suma distancia y a veces sube un pasajero
    function startTracking(driverId) {
        if (trackingTimer && trackedDriverId === driverId) return;
        stopTracking();
        trackedDriverId = driverId;
        trackingTimer = setInterval(() => {
            const shift = shifts.value.find(s => s.driverId === driverId && s.isActive);
            if (!shift) return;
            const newPassengers = Math.random() < 0.3 ? 1 : 0;
            lastProgressRequest = saveShift({
                ...shift,
                distanceKm: Math.round((shift.distanceKm + KM_PER_TICK) * 100) / 100,
                passengers: shift.passengers + newPassengers,
                revenue: Math.round((shift.revenue + newPassengers * FARE) * 100) / 100
            });
        }, TRACKING_INTERVAL_MS);
    }

    // detiene la simulación
    function stopTracking() {
        clearInterval(trackingTimer);
        trackingTimer = null;
        trackedDriverId = null;
    }

    // para la simulación y guarda la hora de fin
    function finishShift(shift) {
        stopTracking();
        return lastProgressRequest.then(() => {
            const latest = shifts.value.find(s => s.id === shift.id) ?? shift;
            return saveShift({...latest, endTime: nowAsText(), status: 'finished'});
        });
    }

    return reactive({
        shifts, errors, shiftsLoaded,
        fetchShifts, getShiftsByDriverId, getCurrentShift, startShift, finishShift,
        startTracking, stopTracking
    });
}

// el store se crea una sola vez y todos los componentes lo comparten
let operationsStore = null;

const useOperationsStore = () => {
    if (operationsStore === null) operationsStore = createOperationsStore();
    return operationsStore;
};

export default useOperationsStore;
