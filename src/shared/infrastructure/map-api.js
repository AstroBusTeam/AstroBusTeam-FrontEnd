import axios from "axios";

// servidor de imágenes del mapa (OpenStreetMap)
const mapTilesUrl = import.meta.env.VITE_MAP_TILES_URL;

// Client for the external OpenStreetMap tile server (third-party service).
export class MapApi {
    // pedimos una imagen del mapa con axios, llega como blob
    getTile(zoom, x, y) {
        return axios.get(`${mapTilesUrl}/${zoom}/${x}/${y}.png`, { responseType: 'blob' });
    }
}
