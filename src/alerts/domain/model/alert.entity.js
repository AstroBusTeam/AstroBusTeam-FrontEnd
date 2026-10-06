// intentos máximos antes de que la alerta sea crítica
export const MAX_ATTEMPTS = 3;

// entidad alerta
export class Alert {
    constructor({ id = null, code = '', vehicleId = null, type = '', receiver = '', attempts = 1, status = 'pending',
                  createdAt = '', latitude = 0, longitude = 0 }) {
        this.id = id;
        this.code = code;
        this.vehicleId = vehicleId;
        this.type = type;
        this.receiver = receiver;
        this.attempts = attempts;
        this.status = status;
        this.createdAt = createdAt;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    get isConfirmed() {
        return this.status === 'confirmed';
    }

    get isCritical() {
        return this.status === 'critical';
    }

    // solo la hora
    get time() {
        return this.createdAt.slice(11, 19);
    }
}
