import {BaseApi} from "./base-api.js";
import {BaseEndpoint} from "./base-endpoint.js";

const env = import.meta.env;
const paths = {
    routes: env.VITE_ROUTES_ENDPOINT_PATH ?? "/routes",
    alertTypes: env.VITE_ALERT_TYPES_ENDPOINT_PATH ?? "/alert-types",
    channels: env.VITE_NOTIFICATION_CHANNELS_ENDPOINT_PATH ?? "/notification-channels",
    positions: env.VITE_VEHICLE_POSITIONS_ENDPOINT_PATH ?? "/vehicle-positions",
    recipients: env.VITE_RECIPIENTS_ENDPOINT_PATH ?? "/recipients",
    assignments: env.VITE_ASSIGNMENTS_ENDPOINT_PATH ?? "/assignments",
    shifts: env.VITE_SHIFTS_ENDPOINT_PATH ?? "/shifts",
    alerts: env.VITE_ALERTS_ENDPOINT_PATH ?? "/alerts",
    vehicles: env.VITE_VEHICLES_ENDPOINT_PATH ?? "/vehicles",
};

const http = new BaseApi().http;

const norm = (value) => (value ?? "").toString().trim().toLowerCase();
const nowAsText = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
};
const todayAsText = () => nowAsText().slice(0, 10);

const catalog = {routes: [], alertTypes: [], channels: [], recipients: []};
let catalogPromise = null;

function loadCatalog(force = false) {
    if (force || catalogPromise === null) {
        catalogPromise = Promise.all([
            http.get(paths.routes), http.get(paths.alertTypes), http.get(paths.channels), http.get(paths.recipients),
        ]).then(([routes, alertTypes, channels, recipients]) => {
            catalog.routes = routes.data;
            catalog.alertTypes = alertTypes.data;
            catalog.channels = channels.data;
            catalog.recipients = recipients.data;
        }).catch((error) => {
            catalogPromise = null;
            throw error;
        });
    }
    return catalogPromise;
}

const routeById = (id) => catalog.routes.find((r) => r.id === id);
const typeById = (id) => catalog.alertTypes.find((t) => t.id === id);
const channelById = (id) => catalog.channels.find((c) => c.id === id);
const recipientById = (id) => catalog.recipients.find((r) => r.id === id);

const routeText = (id) => {
    const route = routeById(id);
    return route ? `${route.code} ${route.name}` : "";
};

function upsert(list, item) {
    const index = list.findIndex((i) => i.id === item.id);
    if (index >= 0) list[index] = item; else list.push(item);
}

async function resolveRouteId(text) {
    await loadCatalog();
    const wanted = norm(text);
    const found = catalog.routes.find((r) =>
        norm(r.code) === wanted || norm(r.name) === wanted || norm(`${r.code} ${r.name}`) === wanted)
        ?? catalog.routes.find((r) => wanted !== "" && (norm(r.name).includes(wanted) || wanted.includes(norm(r.code))));
    if (found) return found.id;
    const {data} = await http.post(paths.routes, {
        code: `RT-${Date.now().toString().slice(-6)}`,
        name: (text ?? "Ruta").toString().trim().slice(0, 120) || "Ruta",
        origin: "Por definir", destination: "Por definir", distanceKm: 0, active: true,
    });
    upsert(catalog.routes, data);
    return data.id;
}

async function resolveAlertTypeId(name) {
    await loadCatalog();
    const wanted = norm(name);
    const found = catalog.alertTypes.find((t) => norm(t.name) === wanted);
    if (found) return found.id;
    const {data} = await http.post(paths.alertTypes, {
        name: (name ?? "Alerta").toString().trim().slice(0, 60) || "Alerta",
        defaultPriority: "medium", isPanic: wanted.includes("pánico") || wanted.includes("panico"),
    });
    upsert(catalog.alertTypes, data);
    return data.id;
}

async function resolveReceiverId(name) {
    await loadCatalog();
    const wanted = norm(name);
    const found = catalog.recipients.find((r) => norm(r.name) === wanted)
        ?? catalog.recipients.find((r) => r.active) ?? catalog.recipients[0];
    if (!found) throw new Error("No hay destinatarios registrados para recibir la alerta");
    return found.id;
}

const telemetry = new Map();      // shiftId -> {speedKmh, speedSamples}
const incidentCounts = new Map(); // shiftId -> cantidad de alertas del turno
const vehicleCoordinates = new Map();

async function refreshIncidents() {
    try {
        const {data} = await http.get(paths.alerts);
        incidentCounts.clear();
        for (const alert of data) {
            if (alert.shiftId != null) incidentCounts.set(alert.shiftId, (incidentCounts.get(alert.shiftId) ?? 0) + 1);
        }
    } catch {
        // los incidentes son informativos; si falla se muestran con el último valor conocido
    }
}

async function reportPosition(shift) {
    try {
        let coordinates = vehicleCoordinates.get(shift.vehicleId);
        if (!coordinates) {
            const {data} = await http.get(`${paths.vehicles}/${shift.vehicleId}`);
            coordinates = {latitude: data.currentLatitude, longitude: data.currentLongitude};
            vehicleCoordinates.set(shift.vehicleId, coordinates);
        }
        await http.post(paths.positions, {
            vehicleId: shift.vehicleId, shiftId: shift.id,
            latitude: coordinates.latitude, longitude: coordinates.longitude, speedKmh: shift.speedKmh,
        });
    } catch {
        // la muestra de velocidad es informativa; el turno ya se guardó
    }
}

const PRIORITY_LABEL = {low: "Baja", medium: "Media", high: "Alta", critical: "Crítica"};
const PRIORITY_VALUE = {baja: "low", media: "medium", alta: "high", "crítica": "critical", critica: "critical",
    low: "low", medium: "medium", high: "high", critical: "critical"};

const translators = {
    drivers: {
        fromApi: (r) => ({...r, category: r.licenseCategory}),
        toApi: async (e, prev) => {
            const {category, ...rest} = e;
            return {...prev, ...rest, licenseCategory: category ?? prev?.licenseCategory};
        },
    },

    vehicles: {
        fromApi: (r) => ({...r, latitude: r.currentLatitude, longitude: r.currentLongitude}),
        toApi: async (e, prev) => {
            const {latitude, longitude, ...rest} = e;
            return {
                ...prev, ...rest,
                currentLatitude: latitude ?? prev?.currentLatitude ?? -12.0464,
                currentLongitude: longitude ?? prev?.currentLongitude ?? -77.0428,
            };
        },
    },

    assignments: {
        fromApi: (r) => ({...r, route: routeText(r.routeId)}),
        toApi: async (e, prev) => ({
            driverId: e.driverId, vehicleId: e.vehicleId,
            routeId: prev?.routeId ?? await resolveRouteId(e.route),
            startTime: (e.startTime ?? "06:00").toString().slice(0, 5),
            status: e.status ?? "active",
            validFrom: todayAsText(),
        }),
    },

    shifts: {
        fromApi: (r) => {
            const route = routeById(r.routeId);
            const live = telemetry.get(r.id) ?? {};
            return {
                ...r,
                date: r.shiftDate,
                routeCode: route?.code ?? "",
                routeName: route?.name ?? "",
                incidents: incidentCounts.get(r.id) ?? 0,
                speedKmh: live.speedKmh ?? 0,
                speedSamples: live.speedSamples ?? 0,
            };
        },
        toApi: async (e, prev) => {
            let assignmentId = prev?.assignmentId;
            let routeId = prev?.routeId;
            if (!prev) {
                const {data} = await http.get(paths.assignments, {params: {driverId: e.driverId, status: "active"}});
                const assignment = data.find((a) => a.vehicleId === e.vehicleId) ?? data[0];
                if (!assignment) throw new Error("El conductor no tiene una asignación activa");
                assignmentId = assignment.id;
                routeId = assignment.routeId;
            }
            return {
                assignmentId, routeId,
                driverId: e.driverId, vehicleId: e.vehicleId,
                shiftDate: e.date ?? prev?.shiftDate ?? todayAsText(),
                startTime: e.startTime,
                endTime: e.endTime ?? null,
                distanceKm: e.distanceKm ?? 0,
                passengers: e.passengers ?? 0,
                revenue: e.revenue ?? 0,
                status: e.status ?? "active",
                averageSpeedKmh: e.averageSpeedKmh ?? 0,
                maxSpeedKmh: e.maxSpeedKmh ?? 0,
                overspeedEvents: e.overspeedEvents ?? 0,
            };
        },
    },

    alerts: {
        fromApi: (r) => ({
            ...r,
            type: typeById(r.alertTypeId)?.name ?? "",
            receiver: recipientById(r.receiverId)?.name ?? "",
        }),
        toApi: async (e, prev) => {
            if (prev) {
                const confirmed = e.status === "confirmed";
                return {
                    code: e.code, vehicleId: e.vehicleId,
                    driverId: prev.driverId ?? null, shiftId: prev.shiftId ?? null,
                    alertTypeId: prev.alertTypeId, receiverId: prev.receiverId,
                    attempts: e.attempts, status: e.status,
                    createdAt: e.createdAt ?? prev.createdAt,
                    latitude: e.latitude, longitude: e.longitude,
                    confirmedAt: confirmed ? (prev.confirmedAt ?? nowAsText()) : (prev.confirmedAt ?? null),
                    confirmedBy: prev.confirmedBy ?? null,
                    notes: prev.notes ?? null,
                };
            }
            // una alerta nueva se asocia al turno activo del vehículo, si lo tiene
            let shift = null;
            try {
                const {data} = await http.get(paths.shifts);
                shift = data.find((s) => s.vehicleId === e.vehicleId && s.status === "active") ?? null;
            } catch {
                shift = null;
            }
            return {
                code: e.code, vehicleId: e.vehicleId,
                driverId: shift?.driverId ?? null, shiftId: shift?.id ?? null,
                alertTypeId: await resolveAlertTypeId(e.type),
                receiverId: await resolveReceiverId(e.receiver),
                attempts: e.attempts, status: e.status, createdAt: e.createdAt,
                latitude: e.latitude, longitude: e.longitude,
            };
        },
    },

    recipients: {
        fromApi: (r) => ({
            ...r,
            channel: (r.channelIds ?? []).map((id) => (channelById(id)?.code ?? "").toUpperCase()).filter(Boolean).join(" / "),
        }),
        toApi: async (e, prev) => ({
            name: e.name, role: e.role, active: e.active,
            email: prev?.email ?? null, phone: prev?.phone ?? null,
            controlCenterId: prev?.controlCenterId ?? null,
            channelIds: prev?.channelIds ?? [],
        }),
    },

    deliveries: {
        fromApi: (r) => ({
            ...r,
            recipientName: recipientById(r.recipientId)?.name ?? "",
            channel: (channelById(r.channelId)?.code ?? "").toUpperCase(),
            alertType: typeById(r.alertTypeId)?.name ?? "",
            priority: PRIORITY_LABEL[r.priority] ?? r.priority,
        }),
        toApi: async (e) => {
            await loadCatalog();
            const recipient = catalog.recipients.find((r) => norm(r.name) === norm(e.recipientName));
            if (!recipient) throw new Error("El destinatario de la entrega no existe");
            const firstChannel = norm(e.channel).split("/")[0].trim();
            const channel = catalog.channels.find((c) => norm(c.code) === firstChannel)
                ?? channelById(recipient.channelIds?.[0]) ?? catalog.channels[0];
            if (!channel) throw new Error("No hay canales de notificación registrados");
            const {data: alerts} = await http.get(paths.alerts);
            const alert = alerts.reduce((latest, a) => (!latest || a.id > latest.id ? a : latest), null);
            if (!alert) throw new Error("No hay alertas a las que asociar la entrega");
            return {
                alertId: alert.id, recipientId: recipient.id, channelId: channel.id,
                alertTypeId: await resolveAlertTypeId(e.alertType),
                priority: PRIORITY_VALUE[norm(e.priority)] ?? "medium",
                status: e.status ?? "sent",
                sentAt: e.sentAt,
            };
        },
    },
};


export class AdaptedEndpoint extends BaseEndpoint {
    #kind;
    #translator;
    #raw = new Map();

    constructor(kind, baseApi, endpointPath) {
        super(baseApi, endpointPath);
        this.#kind = kind;
        this.#translator = translators[kind];
    }

    #remember(resource) {
        this.#raw.set(resource.id, resource);
        if (this.#kind === "recipients") upsert(catalog.recipients, resource);
        return this.#translator.fromApi(resource);
    }

    async getAll(params = {}) {
        const response = await super.getAll(params);
        await loadCatalog();
        if (this.#kind === "shifts") await refreshIncidents();
        response.data = response.data.map((resource) => this.#remember(resource));
        return response;
    }

    async getById(id) {
        const response = await super.getById(id);
        await loadCatalog();
        response.data = this.#remember(response.data);
        return response;
    }

    async create(resource) {
        await loadCatalog();
        const payload = await this.#translator.toApi(resource, undefined);
        const response = await super.create(payload);
        if (this.#kind === "shifts") telemetry.set(response.data.id, {speedKmh: 0, speedSamples: 0});
        response.data = this.#remember(response.data);
        return response;
    }

    async update(id, resource) {
        await loadCatalog();
        const previous = this.#raw.get(id) ?? (await super.getById(id)).data;
        const payload = await this.#translator.toApi(resource, previous);
        const response = await super.update(id, payload);
        if (this.#kind === "shifts") {
            const live = {speedKmh: resource.speedKmh ?? 0, speedSamples: resource.speedSamples ?? 0};
            telemetry.set(id, live);
            if (resource.status === "active" && live.speedKmh > 0) {
                reportPosition({id, vehicleId: resource.vehicleId, speedKmh: live.speedKmh});
            }
        }
        response.data = this.#remember(response.data);
        return response;
    }

    async delete(id) {
        if (this.#kind === "assignments") {
            return http.put(`${this.endpointPath}/${id}`, {status: "inactive", validTo: todayAsText()});
        }
        return super.delete(id);
    }
}
