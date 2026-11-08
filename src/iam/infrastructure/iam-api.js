import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {AdaptedEndpoint} from "../../shared/infrastructure/backend-adapter.js";

const driversEndpointPath     = import.meta.env.VITE_DRIVERS_ENDPOINT_PATH;
const vehiclesEndpointPath    = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;
const assignmentsEndpointPath = import.meta.env.VITE_ASSIGNMENTS_ENDPOINT_PATH;

export class IamApi extends BaseApi {
    #driversEndpoint;
    #vehiclesEndpoint;
    #assignmentsEndpoint;

    constructor() {
        super();
        this.#driversEndpoint     = new AdaptedEndpoint('drivers', this, driversEndpointPath);
        this.#vehiclesEndpoint    = new AdaptedEndpoint('vehicles', this, vehiclesEndpointPath);
        this.#assignmentsEndpoint = new AdaptedEndpoint('assignments', this, assignmentsEndpointPath);
    }

    // busca el conductor por su código
    getDriversByEmployeeCode(employeeCode) {
        return this.#driversEndpoint.getAll({ employeeCode });
    }

    // busca la asignación activa del conductor
    getActiveAssignments(driverId) {
        return this.#assignmentsEndpoint.getAll({ driverId, status: 'active' });
    }

    // trae el bus
    getVehicleById(id) {
        return this.#vehiclesEndpoint.getById(id);
    }
}
