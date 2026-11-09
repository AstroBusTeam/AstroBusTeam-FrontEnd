// intentos máximos antes de que la alerta sea crítica
export const MAX_ATTEMPTS = 3;

// entidad alerta
export class Alert {
    constructor({ id = null, code = '', vehicleId = null, type = '', receiver = '', attempts = 1, status = 'pending',
                  createdAt = '', latitude = 0, longitude = 0 }) {
        this.id = id;
        this.code = code;
        this.vehicleId = vehicleId;
        this.type = type; // nombre del tipo de alerta
        this.receiver = receiver; // nombre de quien la recibe
        this.attempts = attempts; // veces que se envió
        this.status = status; // 'pending', 'timeout', 'critical' o 'confirmed'
        this.createdAt = createdAt; // yyyy-mm-ddThh:mm:ss
        // ubicación del bus cuando se envió
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // la central ya respondió
    get isConfirmed() {
        return this.status === 'confirmed';
    }

    // llegó al máximo de intentos sin respuesta
    get isCritical() {
        return this.status === 'critical';
    }

    // solo la hora
    get time() {
        return this.createdAt.slice(11, 19);
    }
}
