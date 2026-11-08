import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {AdaptedEndpoint} from "../../shared/infrastructure/backend-adapter.js";

const alertsEndpointPath     = import.meta.env.VITE_ALERTS_ENDPOINT_PATH;
const recipientsEndpointPath = import.meta.env.VITE_RECIPIENTS_ENDPOINT_PATH;
const deliveriesEndpointPath = import.meta.env.VITE_DELIVERIES_ENDPOINT_PATH;

// api de alertas, destinatarios y entregas
export class AlertsApi extends BaseApi {
    #alertsEndpoint;
    #recipientsEndpoint;
    #deliveriesEndpoint;

    constructor() {
        super();
        this.#alertsEndpoint     = new AdaptedEndpoint('alerts', this, alertsEndpointPath);
        this.#recipientsEndpoint = new AdaptedEndpoint('recipients', this, recipientsEndpointPath);
        this.#deliveriesEndpoint = new AdaptedEndpoint('deliveries', this, deliveriesEndpointPath);
    }

    getAlerts()              { return this.#alertsEndpoint.getAll(); }
    createAlert(resource)    { return this.#alertsEndpoint.create(resource); }
    updateAlert(resource)    { return this.#alertsEndpoint.update(resource.id, resource); }
    deleteAlert(id)          { return this.#alertsEndpoint.delete(id); }

    getRecipients()           { return this.#recipientsEndpoint.getAll(); }
    updateRecipient(resource) { return this.#recipientsEndpoint.update(resource.id, resource); }

    getDeliveries()           { return this.#deliveriesEndpoint.getAll(); }
    createDelivery(resource)  { return this.#deliveriesEndpoint.create(resource); }
}
