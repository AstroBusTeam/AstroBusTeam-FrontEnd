import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const shiftsEndpointPath = import.meta.env.VITE_SHIFTS_ENDPOINT_PATH;

// api de turnos
export class OperationsApi extends BaseApi {
    #shiftsEndpoint;

    constructor() {
        super();
        this.#shiftsEndpoint = new BaseEndpoint(this, shiftsEndpointPath);
    }

    getShifts()            { return this.#shiftsEndpoint.getAll(); }
    createShift(resource)  { return this.#shiftsEndpoint.create(resource); }
    updateShift(resource)  { return this.#shiftsEndpoint.update(resource.id, resource); }
}
