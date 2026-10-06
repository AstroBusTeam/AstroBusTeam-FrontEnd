import {Alert} from "../domain/model/alert.entity.js";

export class AlertAssembler {
    // convierte un recurso de la api en una entidad
    static toEntityFromResource(resource) {
        return new Alert({...resource});
    }

    // convierte la lista que llega de la api en entidades
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        return response.data.map(resource => this.toEntityFromResource(resource));
    }
}
