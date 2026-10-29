import {SPEED_LIMIT_KMH, speedStatus} from "./speed-policy.js";

// entidad turno (un servicio de un conductor)
export class Shift {
    constructor({ id = null, driverId = null, vehicleId = null, routeCode = '', routeName = '', date = '',
                    startTime = null, endTime = null, distanceKm = 0, passengers = 0, revenue = 0, incidents = 0,
                    status = 'active', speedKmh = 0, maxSpeedKmh = 0, averageSpeedKmh = 0, speedSamples = 0,
                    overspeedEvents = 0 }) {
        this.id = id;
        this.driverId = driverId;
        this.vehicleId = vehicleId;
        this.routeCode = routeCode;
        this.routeName = routeName;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.distanceKm = distanceKm;
        this.passengers = passengers;
        this.revenue = revenue;
        this.incidents = incidents;
        this.status = status;
        this.speedKmh = speedKmh;
        this.maxSpeedKmh = maxSpeedKmh;
        this.averageSpeedKmh = averageSpeedKmh;
        this.speedSamples = speedSamples;
        this.overspeedEvents = overspeedEvents;
    }

    // true si el servicio sigue en curso
    get isActive() {
        return this.status === 'active';
    }

    // tiempo del turno en formato HH:MM:SS
    getDuration(now = new Date()) {
        // si todavía no termina usamos la hora actual
        const end = this.endTime ? new Date(this.endTime) : now;
        const totalSeconds = Math.max(0, Math.floor((end - new Date(this.startTime)) / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
    }

    // true si la velocidad actual supera el límite
    get isOverspeeding() {
        return this.speedKmh > SPEED_LIMIT_KMH;
    }

    // estado de la velocidad actual
    get speedStatus() {
        return speedStatus(this.speedKmh);
    }

    // velocidad promedio guardada, o calculada para turnos antiguos
    get averageSpeed() {
        if (this.averageSpeedKmh > 0) return this.averageSpeedKmh;
        if (!this.startTime) return null;

        const end = this.endTime ? new Date(this.endTime) : new Date();
        const hours = (end - new Date(this.startTime)) / 3600000;
        if (hours <= 0) return null;

        const estimated = this.distanceKm / hours;
        // descartamos valores incoherentes de datos antiguos
        return estimated >= 5 && estimated <= SPEED_LIMIT_KMH ? Math.round(estimated * 10) / 10 : null;
    }

    // true si el turno tiene alguna medición de velocidad
    get hasSpeedData() {
        return this.speedSamples > 0 || this.maxSpeedKmh > 0;
    }
}
