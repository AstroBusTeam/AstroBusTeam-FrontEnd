import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {AdaptedEndpoint} from "../../shared/infrastructure/backend-adapter.js";

const driversEndpointPath     = import.meta.env.VITE_DRIVERS_ENDPOINT_PATH;
const vehiclesEndpointPath    = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;
const assignmentsEndpointPath = import.meta.env.VITE_ASSIGNMENTS_ENDPOINT_PATH;

// api de conductores, vehículos y asignaciones
export class FleetApi extends BaseApi {
    #driversEndpoint;
    #vehiclesEndpoint;
    #assignmentsEndpoint;

    constructor() {
        super();
        this.#driversEndpoint     = new AdaptedEndpoint('drivers', this, driversEndpointPath);
        this.#vehiclesEndpoint    = new AdaptedEndpoint('vehicles', this, vehiclesEndpointPath);
        this.#assignmentsEndpoint = new AdaptedEndpoint('assignments', this, assignmentsEndpointPath);
    }

    // conductores
    getDrivers()             { return this.#driversEndpoint.getAll(); }
    createDriver(resource)   { return this.#driversEndpoint.create(resource); }
    updateDriver(resource)   { return this.#driversEndpoint.update(resource.id, resource); }
    deleteDriver(id)         { return this.#driversEndpoint.delete(id); }

    // vehículos
    getVehicles()            { return this.#vehiclesEndpoint.getAll(); }
    createVehicle(resource)  { return this.#vehiclesEndpoint.create(resource); }
    updateVehicle(resource)  { return this.#vehiclesEndpoint.update(resource.id, resource); }
    deleteVehicle(id)        { return this.#vehiclesEndpoint.delete(id); }

    // asignaciones
    getAssignments()           { return this.#assignmentsEndpoint.getAll(); }
    createAssignment(resource) { return this.#assignmentsEndpoint.create(resource); }
    deleteAssignment(id)       { return this.#assignmentsEndpoint.delete(id); }
}
