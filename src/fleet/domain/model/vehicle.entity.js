// entidad vehículo (bus)
export class Vehicle {
    constructor({ id = null, code = '', plate = '', model = '', capacity = 0, status = 'available',
                  latitude = -12.0464, longitude = -77.0428 }) {
        this.id = id;
        this.code = code;
        this.plate = plate;
        this.model = model;
        this.capacity = capacity; // cantidad de pasajeros
        this.status = status; // 'available', 'in-service' o 'maintenance'
        // última posición conocida, por defecto el centro de Lima
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // true si el bus se puede asignar
    get isAvailable() {
        return this.status === 'available';
    }
}
