// asignación: une un conductor con un bus y una ruta
export class Assignment {
    constructor({ id = null, driverId = null, vehicleId = null, route = '', startTime = '', status = 'active' }) {
        this.id = id;
        this.driverId = driverId;
        this.vehicleId = vehicleId;
        this.route = route;
        this.startTime = startTime;
        this.status = status;
    }
}
