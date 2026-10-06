// clase con el CRUD que usan todas las apis
export class BaseEndpoint {
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }

    // traer todos (params sirve para filtrar)
    getAll(params = {}) {
        return this.http.get(this.endpointPath, { params });
    }

    // traer uno por id
    getById(id) {
        return this.http.get(`${this.endpointPath}/${id}`);
    }

    // crear
    create(resource) {
        return this.http.post(this.endpointPath, resource);
    }

    // actualizar
    update(id, resource) {
        return this.http.put(`${this.endpointPath}/${id}`, resource);
    }

    // eliminar
    delete(id) {
        return this.http.delete(`${this.endpointPath}/${id}`);
    }
}
