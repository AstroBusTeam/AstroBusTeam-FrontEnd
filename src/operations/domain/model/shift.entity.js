// entidad turno (un servicio de un conductor)
export class Shift {
    constructor({ id = null, driverId = null, vehicleId = null, routeCode = '', routeName = '', date = '',
                  startTime = null, endTime = null, distanceKm = 0, passengers = 0, revenue = 0, incidents = 0,
                  status = 'active' }) {
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
}
