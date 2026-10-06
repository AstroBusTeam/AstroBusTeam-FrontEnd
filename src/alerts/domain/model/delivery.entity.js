// una notificación enviada a un destinatario
export class Delivery {
    constructor({ id = null, recipientName = '', channel = '', alertType = '', priority = '', status = 'sent', sentAt = '' }) {
        this.id = id;
        this.recipientName = recipientName;
        this.channel = channel;
        this.alertType = alertType;
        this.priority = priority;
        this.status = status;
        this.sentAt = sentAt;
    }
}
