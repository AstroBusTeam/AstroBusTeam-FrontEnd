import {computed, reactive, ref} from "vue";
import {AlertsApi} from "../infrastructure/alerts-api.js";
import {AlertAssembler} from "../infrastructure/alert.assembler.js";
import {RecipientAssembler} from "../infrastructure/recipient.assembler.js";
import {DeliveryAssembler} from "../infrastructure/delivery.assembler.js";
import {MAX_ATTEMPTS} from "../domain/model/alert.entity.js";

const alertsApi = new AlertsApi();

// fecha y hora actual como texto
function nowAsText() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19);
}

function createAlertsStore() {
    // datos del store
    const alerts = ref([]);
    const recipients = ref([]);
    const deliveries = ref([]);
    const errors = ref([]);
    const alertsLoaded = ref(false);
    const recipientsLoaded = ref(false);
    const deliveriesLoaded = ref(false);

    // alertas sin confirmar
    const unconfirmedAlerts = computed(() => alerts.value.filter(alert => !alert.isConfirmed));

    const criticalAlerts = computed(() => alerts.value.filter(alert => alert.isCritical));

    // traer los datos de la api
    function fetchAlerts() {
        alertsApi.getAlerts().then(response => {
            alerts.value = AlertAssembler.toEntitiesFromResponse(response)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            alertsLoaded.value = true;
        }).catch(error => errors.value.push(error));
    }

    function fetchRecipients() {
        alertsApi.getRecipients().then(response => {
            recipients.value = RecipientAssembler.toEntitiesFromResponse(response);
            recipientsLoaded.value = true;
        }).catch(error => errors.value.push(error));
    }

    function fetchDeliveries() {
        alertsApi.getDeliveries().then(response => {
            deliveries.value = DeliveryAssembler.toEntitiesFromResponse(response).reverse();
            deliveriesLoaded.value = true;
        }).catch(error => errors.value.push(error));
    }

    function getAlertById(id) {
        return alerts.value.find(alert => alert.id === parseInt(id));
    }

    // guarda la alerta y actualiza la lista
    function saveAlert(alert) {
        return alertsApi.updateAlert(alert).then(response => {
            const updated = AlertAssembler.toEntityFromResource(response.data);
            alerts.value = alerts.value.map(a => a.id === updated.id ? updated : a);
        }).catch(error => errors.value.push(error));
    }

    // crea la alerta del botón de pánico con la ubicación del bus
    function sendPanicAlert(vehicle) {
        const alert = {
            code: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
            vehicleId: vehicle.id,
            type: 'Botón de pánico',
            receiver: 'CENTRAL_OPERACIONES',
            attempts: 1,
            status: 'pending',
            createdAt: nowAsText(),
            latitude: vehicle.latitude,
            longitude: vehicle.longitude
        };
        return alertsApi.createAlert(alert).then(response => {
            const created = AlertAssembler.toEntityFromResource(response.data);
            alerts.value = [created, ...alerts.value];
            return created;
        });
    }

    // reenviar, al tercer intento pasa a crítica
    function resendAlert(alert) {
        if (alert.isConfirmed || alert.isCritical) return;
        const attempts = alert.attempts + 1;
        const status = attempts >= MAX_ATTEMPTS ? 'critical' : 'pending';
        return saveAlert({...alert, attempts, status});
    }

    // la central confirma la alerta
    function confirmAlert(alert) {
        return saveAlert({...alert, status: 'confirmed'});
    }

    function deleteAlert(alert) {
        return alertsApi.deleteAlert(alert.id).then(() => {
            alerts.value = alerts.value.filter(a => a.id !== alert.id);
        }).catch(error => errors.value.push(error));
    }

    // activar o desactivar un destinatario
    function toggleRecipient(recipient) {
        alertsApi.updateRecipient({...recipient, active: !recipient.active}).then(response => {
            const updated = RecipientAssembler.toEntityFromResource(response.data);
            recipients.value = recipients.value.map(r => r.id === updated.id ? updated : r);
        }).catch(error => errors.value.push(error));
    }

    // manda una notificación a cada destinatario activo
    function sendSimulation(alertType, priority) {
        const activeRecipients = recipients.value.filter(recipient => recipient.active);
        const requests = activeRecipients.map(recipient => alertsApi.createDelivery({
            recipientName: recipient.name,
            channel: recipient.channel,
            alertType,
            priority,
            status: 'sent',
            sentAt: nowAsText()
        }).then(response => {
            deliveries.value = [DeliveryAssembler.toEntityFromResource(response.data), ...deliveries.value];
        }));
        return Promise.all(requests).then(() => activeRecipients.length)
            .catch(error => errors.value.push(error));
    }

    return reactive({
        alerts, recipients, deliveries, errors,
        alertsLoaded, recipientsLoaded, deliveriesLoaded,
        unconfirmedAlerts, criticalAlerts,
        fetchAlerts, fetchRecipients, fetchDeliveries, getAlertById,
        sendPanicAlert, resendAlert, confirmAlert, deleteAlert,
        toggleRecipient, sendSimulation
    });
}

// el store se crea una sola vez y todos los componentes lo comparten
let alertsStore = null;

const useAlertsStore = () => {
    if (alertsStore === null) alertsStore = createAlertsStore();
    return alertsStore;
};

export default useAlertsStore;
