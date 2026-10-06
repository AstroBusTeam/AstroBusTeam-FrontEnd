import axios from "axios";

// url de la api, viene del archivo .env
const platformApi = import.meta.env.VITE_SAFEBUS_API_URL;

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

    get http() {
        return this.#http;
    }
}
