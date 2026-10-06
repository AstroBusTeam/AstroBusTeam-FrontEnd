<script setup>
import {computed, onUnmounted, ref, watch} from "vue";
import {MapApi} from "../../infrastructure/map-api.js";

// recibe el centro, los marcadores, el zoom y el alto del mapa
const props = defineProps({
  center:  { type: Object, required: true },
  markers: { type: Array, default: () => [] },
  zoom:    { type: Number, default: 15 },
  height:  { type: String, default: '500px' }
});

const mapApi = new MapApi();
// cada imagen del mapa mide 256x256 y usamos una grilla de 5x4
const TILE_SIZE = 256;
const COLUMNS = 5;
const ROWS = 4;

const currentZoom = ref(props.zoom);
const tiles = ref([]);
const selectedMarker = ref(null);

// convierte latitud y longitud a pixeles
function toPixel(latitude, longitude) {
  const worldSize = TILE_SIZE * Math.pow(2, currentZoom.value);
  const latitudeRad = latitude * Math.PI / 180;
  return {
    x: (longitude + 180) / 360 * worldSize,
    y: (1 - Math.log(Math.tan(latitudeRad) + 1 / Math.cos(latitudeRad)) / Math.PI) / 2 * worldSize
  };
}

const centerPixel = computed(() => toPixel(props.center.latitude, props.center.longitude));

// esquina de arriba a la izquierda de la grilla
const origin = computed(() => ({
  x: (Math.floor(centerPixel.value.x / TILE_SIZE) - Math.floor(COLUMNS / 2)) * TILE_SIZE,
  y: (Math.floor(centerPixel.value.y / TILE_SIZE) - Math.floor(ROWS / 2)) * TILE_SIZE
}));

const gridStyle = computed(() => ({
  width: `${COLUMNS * TILE_SIZE}px`,
  height: `${ROWS * TILE_SIZE}px`,
  left: `calc(50% - ${centerPixel.value.x - origin.value.x}px)`,
  top: `calc(50% - ${centerPixel.value.y - origin.value.y}px)`
}));

// posición de cada marcador en el mapa
function markerStyle(marker) {
  const pixel = toPixel(marker.latitude, marker.longitude);
  return { left: `${pixel.x - origin.value.x}px`, top: `${pixel.y - origin.value.y}px` };
}

function releaseTiles() {
  tiles.value.forEach(tile => tile.url && URL.revokeObjectURL(tile.url));
}

// descarga todas las imágenes del mapa
function loadTiles() {
  releaseTiles();
  const firstColumn = origin.value.x / TILE_SIZE;
  const firstRow = origin.value.y / TILE_SIZE;
  const list = [];
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      list.push({ x: firstColumn + column, y: firstRow + row, left: column * TILE_SIZE, top: row * TILE_SIZE, url: null });
    }
  }
  tiles.value = list;
  tiles.value.forEach(tile => {
    mapApi.getTile(currentZoom.value, tile.x, tile.y).then(response => {
      tile.url = URL.createObjectURL(response.data);
    }).catch(error => console.error('Map tile error', error));
  });
}

// botones de zoom
function zoomIn()  { if (currentZoom.value < 18) currentZoom.value++; }
function zoomOut() { if (currentZoom.value > 11) currentZoom.value--; }

// si cambia el centro o el zoom se vuelve a cargar el mapa
watch(() => [props.center.latitude, props.center.longitude, currentZoom.value], loadTiles, { immediate: true });
watch(() => props.zoom, zoom => currentZoom.value = zoom);
onUnmounted(releaseTiles);
</script>

<template>
  <div class="fleet-map" :style="{ height: height }" @click="selectedMarker = null">
    <div class="fleet-map-grid" :style="gridStyle">
      <img v-for="tile in tiles" :key="`${tile.x}-${tile.y}`" v-show="tile.url" :src="tile.url" alt=""
           class="fleet-map-tile" :style="{ left: `${tile.left}px`, top: `${tile.top}px` }"/>

      <!-- marcadores de buses y alertas -->
      <div v-for="marker in markers" :key="marker.id" class="fleet-map-marker" :style="markerStyle(marker)"
           @click.stop="selectedMarker = marker">
        <span :class="['fleet-map-pin', { 'fleet-map-pin-danger': marker.danger }]">
          <i v-if="marker.danger" class="pi pi-exclamation-triangle"/>
          <template v-else>🚌</template>
        </span>
        <span v-if="marker.label" class="fleet-map-label">{{ marker.label }}</span>
      </div>

      <!-- popup con la info del marcador -->
      <div v-if="selectedMarker" class="fleet-map-popup" :style="markerStyle(selectedMarker)" @click.stop>
        <pv-tag v-if="selectedMarker.danger" severity="danger" value="ALERTA CRÍTICA" class="mb-2"/>
        <div class="font-semibold">{{ selectedMarker.title }}</div>
        <div class="text-sm sb-muted">{{ selectedMarker.description }}</div>
        <router-link v-if="selectedMarker.link" :to="selectedMarker.link" class="block mt-2 text-sm sb-accent">
          VER DETALLES →
        </router-link>
      </div>
    </div>

    <div class="fleet-map-zoom">
      <pv-button icon="pi pi-plus" size="small" severity="secondary" @click.stop="zoomIn"/>
      <pv-button icon="pi pi-minus" size="small" severity="secondary" @click.stop="zoomOut"/>
    </div>
    <div class="fleet-map-attribution">© OpenStreetMap contributors</div>
  </div>
</template>

<style scoped>
.fleet-map {
  position: relative;
  overflow: hidden;
  width: 100%;
  background: #e8e4dc;
  border: 1px solid var(--sb-border);
}

.fleet-map-grid {
  position: absolute;
}

.fleet-map-tile {
  position: absolute;
  width: 256px;
  height: 256px;
  user-select: none;
}

.fleet-map-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 1;
}

.fleet-map-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 1.2rem;
  background: #ffffff;
  border: 2px solid #111;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

/* marcador rojo para las alertas */
.fleet-map-pin-danger {
  background: var(--sb-danger);
  border-color: #fff;
  color: #fff;
  animation: pulse 1.2s infinite;
}

.fleet-map-label {
  margin-top: 2px;
  padding: 0 4px;
  font-size: 0.65rem;
  font-weight: 700;
  background: #111;
  color: var(--sb-accent);
}

.fleet-map-popup {
  position: absolute;
  transform: translate(-50%, calc(-100% - 28px));
  width: 220px;
  padding: 0.75rem;
  background: #111;
  border: 1px solid var(--sb-border);
  color: var(--sb-text);
  z-index: 2;
}

.fleet-map-zoom {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fleet-map-attribution {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0 4px;
  font-size: 0.6rem;
  background: rgba(255, 255, 255, 0.7);
  color: #333;
}

@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.7); }
  100% { box-shadow: 0 0 0 14px rgba(255, 59, 48, 0); }
}
</style>
