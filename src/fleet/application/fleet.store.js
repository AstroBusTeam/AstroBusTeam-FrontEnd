import {computed, reactive, ref} from "vue";
import {FleetApi} from "../infrastructure/fleet-api.js";
import {DriverAssembler} from "../infrastructure/driver.assembler.js";
import {VehicleAssembler} from "../infrastructure/vehicle.assembler.js";
import {AssignmentAssembler} from "../infrastructure/assignment.assembler.js";

const fleetApi = new FleetApi();

// devuelve una lista nueva con el elemento actualizado
function replaceById(list, item) {
    return list.map(element => element.id === item.id ? item : element);
}

// devuelve una lista nueva sin el elemento
function removeById(list, id) {
    return list.filter(element => element.id !== id);
}

function createFleetStore() {
    // datos del store
    const drivers = ref([]);
    const vehicles = ref([]);
    const assignments = ref([]);
    const errors = ref([]);
    const driversLoaded = ref(false);
    const vehiclesLoaded = ref(false);
    const assignmentsLoaded = ref(false);

    // asignaciones que siguen activas
    const activeAssignments = computed(() => assignments.value.filter(a => a.status === 'active'));

    // conductores activos que todavía no tienen bus
    const availableDrivers = computed(() => drivers.value.filter(driver =>
        driver.isActive && !activeAssignments.value.some(a => a.driverId === driver.id)));

    // buses disponibles
    const availableVehicles = computed(() => vehicles.value.filter(vehicle => vehicle.isAvailable));

    // traer los datos de la api
    function fetchDrivers() {
        fleetApi.getDrivers().then(response => {
            drivers.value = DriverAssembler.toEntitiesFromResponse(response);
            driversLoaded.value = true;
        }).catch(error => errors.value.push(error));
    }

    function fetchVehicles() {
        fleetApi.getVehicles().then(response => {
            vehicles.value = VehicleAssembler.toEntitiesFromResponse(response);
            vehiclesLoaded.value = true;
        }).catch(error => errors.value.push(error));
    }

    function fetchAssignments() {
        fleetApi.getAssignments().then(response => {
            assignments.value = AssignmentAssembler.toEntitiesFromResponse(response);
            assignmentsLoaded.value = true;
        }).catch(error => errors.value.push(error));
    }

    // carga todo de una vez
    function fetchAll() {
        fetchDrivers();
        fetchVehicles();
        fetchAssignments();
    }

    function getDriverById(id) {
        return drivers.value.find(driver => driver.id === parseInt(id));
    }

    function getVehicleById(id) {
        return vehicles.value.find(vehicle => vehicle.id === parseInt(id));
    }

    function getAssignmentByDriverId(driverId) {
        return activeAssignments.value.find(a => a.driverId === driverId);
    }

    function getAssignmentByVehicleId(vehicleId) {
        return activeAssignments.value.find(a => a.vehicleId === vehicleId);
    }

    // CRUD de conductores
    function addDriver(driver) {
        fleetApi.createDriver(driver).then(response => {
            drivers.value = [...drivers.value, DriverAssembler.toEntityFromResource(response.data)];
        }).catch(error => errors.value.push(error));
    }

    function updateDriver(driver) {
        fleetApi.updateDriver(driver).then(response => {
            drivers.value = replaceById(drivers.value, DriverAssembler.toEntityFromResource(response.data));
        }).catch(error => errors.value.push(error));
    }

    function deleteDriver(driver) {
        fleetApi.deleteDriver(driver.id).then(() => {
            drivers.value = removeById(drivers.value, driver.id);
        }).catch(error => errors.value.push(error));
    }

    // CRUD de vehículos
    function addVehicle(vehicle) {
        fleetApi.createVehicle(vehicle).then(response => {
            vehicles.value = [...vehicles.value, VehicleAssembler.toEntityFromResource(response.data)];
        }).catch(error => errors.value.push(error));
    }

    function updateVehicle(vehicle) {
        fleetApi.updateVehicle(vehicle).then(response => {
            vehicles.value = replaceById(vehicles.value, VehicleAssembler.toEntityFromResource(response.data));
        }).catch(error => errors.value.push(error));
    }

    function deleteVehicle(vehicle) {
        fleetApi.deleteVehicle(vehicle.id).then(() => {
            vehicles.value = removeById(vehicles.value, vehicle.id);
        }).catch(error => errors.value.push(error));
    }

    // al asignar, el bus pasa a "en servicio"
    function addAssignment(assignment) {
        fleetApi.createAssignment(assignment).then(response => {
            assignments.value = [...assignments.value, AssignmentAssembler.toEntityFromResource(response.data)];
            const vehicle = getVehicleById(assignment.vehicleId);
            if (vehicle) updateVehicle({...vehicle, status: 'in-service'});
        }).catch(error => errors.value.push(error));
    }

    // al liberar, el bus vuelve a estar disponible
    function deleteAssignment(assignment) {
        fleetApi.deleteAssignment(assignment.id).then(() => {
            assignments.value = removeById(assignments.value, assignment.id);
            const vehicle = getVehicleById(assignment.vehicleId);
            if (vehicle) updateVehicle({...vehicle, status: 'available'});
        }).catch(error => errors.value.push(error));
    }

    return reactive({
        drivers, vehicles, assignments, errors,
        driversLoaded, vehiclesLoaded, assignmentsLoaded,
        activeAssignments, availableDrivers, availableVehicles,
        fetchDrivers, fetchVehicles, fetchAssignments, fetchAll,
        getDriverById, getVehicleById, getAssignmentByDriverId, getAssignmentByVehicleId,
        addDriver, updateDriver, deleteDriver,
        addVehicle, updateVehicle, deleteVehicle,
        addAssignment, deleteAssignment
    });
}

// el store se crea una sola vez y todos los componentes lo comparten
let fleetStore = null;

const useFleetStore = () => {
    if (fleetStore === null) fleetStore = createFleetStore();
    return fleetStore;
};

export default useFleetStore;
