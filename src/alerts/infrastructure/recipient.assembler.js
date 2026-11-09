import {Recipient} from "../domain/model/recipient.entity.js";

// pasa los datos de destinatarios de la api a entidades del dominio
export class RecipientAssembler {
    // convierte un recurso de la api en una entidad
    static toEntityFromResource(resource) {
        return new Recipient({...resource});
    }

    // convierte la lista que llega de la api en entidades
    static toEntitiesFromResponse(response) {
        // si la respuesta no es correcta se devuelve una lista vacía
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        return response.data.map(resource => this.toEntityFromResource(resource));
    }
}
