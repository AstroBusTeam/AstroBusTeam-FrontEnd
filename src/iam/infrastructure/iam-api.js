import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const driversEndpointPath     = import.meta.env.VITE_DRIVERS_ENDPOINT_PATH;
const vehiclesEndpointPath    = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;
const assignmentsEndpointPath = import.meta.env.VITE_ASSIGNMENTS_ENDPOINT_PATH;

export class IamApi extends BaseApi {
    #driversEndpoint;
    #vehiclesEndpoint;
    #assignmentsEndpoint;

    constructor() {
        super();
        this.#driversEndpoint     = new BaseEndpoint(this, driversEndpointPath);
        this.#vehiclesEndpoint    = new BaseEndpoint(this, vehiclesEndpointPath);
        this.#assignmentsEndpoint = new BaseEndpoint(this, assignmentsEndpointPath);
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
