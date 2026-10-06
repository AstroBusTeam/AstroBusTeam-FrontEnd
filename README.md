# SecurityBus (AstroBus Team) - Front-end

Front-end de un sistema de gestión de flota de buses y conductores, con sistema de alertas y botón de emergencia.
Hecho con Vue 3, Vite, Vue Router, PrimeVue, vue-i18n y Axios. 

## Cómo ejecutarlo

Se necesitan **dos terminales**:

```bash
npm install
npm run server   # API falsa en http://localhost:3000/api/v1 (json-server + server/db.json)
npm run dev      # Aplicación en http://localhost:5173
```

Para entrar usa un código de empleado de `server/db.json`, por ejemplo **SF-90210** (Marcos Silva).

## Estructura (Domain-Driven Design, igual que learning-center)

```
src/
├── shared/       Layout, toolbar, switch de idioma, mapa (fleet-map.vue) y clientes HTTP base
├── iam/          Verificación de identidad del conductor y sesión
├── operations/   Turnos: dashboard, mapa del servicio, historial de turnos, impacto en números
├── fleet/        Conductores, vehículos y asignaciones (CRUD) + centro de control
└── alerts/       Alertas, botón de pánico, destinatarios y registro de entregas
```

Cada contexto tiene las capas `domain/model` (entidades), `infrastructure` (API con axios y assemblers),
`application` (store hecho con `reactive` de Vue) y `presentation` (rutas y vistas).

## Detalles

- **Idioma:** el switch ES/EN traduce los textos del toolbar, los títulos y los subtítulos (`src/locales/*.json`).
- **Mapas:** las imágenes del mapa (tiles de OpenStreetMap) se descargan con axios en `shared/infrastructure/map-api.js`
  y se dibujan en `shared/presentation/components/fleet-map.vue`.
- **Botón de emergencia:** `SEÑAL DE PÁNICO` (`PANIC SIGNAL` en inglés) en el toolbar crea una alerta con la ubicación del bus;
  se puede cancelar durante 5 segundos.
