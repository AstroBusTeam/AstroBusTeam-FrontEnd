import {reactive, ref} from "vue";
import {OperationsApi} from "../infrastructure/operations-api.js";
import {ShiftAssembler} from "../infrastructure/shift.assembler.js";
import {SPEED_LIMIT_KMH} from "../domain/model/speed-policy.js";

const operationsApi = new OperationsApi();

// datos para simular el avance del bus
const TRACKING_INTERVAL_MS = 5000;
const SPEED_MIN_KMH = 15;
const SPEED_MAX_KMH = 88;
const FARE = 1.5;

// velocidad del siguiente tick: varía suave y a veces da un pico
function nextSpeed(previousSpeed) {
    const base = previousSpeed > 0 ? previousSpeed : 36;
    let speed = base + (Math.random() * 14 - 7);
    if (Math.random() < 0.10) speed += 18;
    return Math.round(Math.min(SPEED_MAX_KMH, Math.max(SPEED_MIN_KMH, speed)));
}

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
            distanceKm: 0, passengers: 0, revenue: 0, incidents: 0, status: 'active',
            speedKmh: 0, maxSpeedKmh: 0, averageSpeedKmh: 0, speedSamples: 0, overspeedEvents: 0
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

    // cada 5 segundos actualiza velocidad, distancia y a veces sube un pasajero
    function startTracking(driverId) {
        if (trackingTimer && trackedDriverId === driverId) return;
        stopTracking();
        trackedDriverId = driverId;
        trackingTimer = setInterval(() => {
            const shift = shifts.value.find(s => s.driverId === driverId && s.isActive);
            if (!shift) return;

            const previousSpeed = shift.speedKmh ?? 0;
            const speedKmh = nextSpeed(previousSpeed);
            const speedSamples = (shift.speedSamples ?? 0) + 1;
            const averageSpeedKmh = Math.round(
                (((shift.averageSpeedKmh ?? 0) * (speedSamples - 1) + speedKmh) / speedSamples) * 10
            ) / 10;
            // la distancia sale de la velocidad: km/h * horas del tick
            const distanceDelta = speedKmh * (TRACKING_INTERVAL_MS / 3600000);
            // contamos un exceso solo al cruzar el límite, no en cada tick
            const overspeedEvents = (shift.overspeedEvents ?? 0)
                + (previousSpeed <= SPEED_LIMIT_KMH && speedKmh > SPEED_LIMIT_KMH ? 1 : 0);
            const newPassengers = Math.random() < 0.3 ? 1 : 0;

            lastProgressRequest = saveShift({
                ...shift,
                speedKmh,
                speedSamples,
                averageSpeedKmh,
                maxSpeedKmh: Math.max(shift.maxSpeedKmh ?? 0, speedKmh),
                overspeedEvents,
                distanceKm: Math.round((shift.distanceKm + distanceDelta) * 100) / 100,
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
            return saveShift({...latest, endTime: nowAsText(), status: 'finished', speedKmh: 0});
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
