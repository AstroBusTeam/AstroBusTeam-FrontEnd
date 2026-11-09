import axios from "axios";

// url de la api, viene del archivo .env
const platformApi = import.meta.env.VITE_SAFEBUS_API_URL;

// Wraps one axios instance so every API class shares the same base URL and headers.
export class BaseApi {
    #http;

    constructor() {
        // creamos axios con la url base
        this.#http = axios.create({
            baseURL: platformApi,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }

    // Exposes the axios instance to the endpoint classes.
    get http() {
        return this.#http;
    }
}
