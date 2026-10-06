// persona que recibe las notificaciones
export class Recipient {
    constructor({ id = null, name = '', role = '', channel = '', active = true }) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.channel = channel;
        this.active = active;
    }
}
