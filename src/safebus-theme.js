import {definePreset} from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

// tema de PrimeVue con los colores del prototipo
const SafeBusTheme = definePreset(Aura, {
    primitive: {
        // bordes casi cuadrados
        borderRadius: { none: '0', xs: '1px', sm: '2px', md: '2px', lg: '3px', xl: '4px' }
    },
    semantic: {
        // color principal: verde lima
        primary: {
            50: '#f9ffe5', 100: '#f1ffbf', 200: '#e6ff8a', 300: '#dbff4d', 400: '#ccff00',
            500: '#b8e600', 600: '#a8d400', 700: '#82a300', 800: '#5c7300', 900: '#3a4800', 950: '#232b00'
        },
        colorScheme: {
            dark: {
                // grises para el modo oscuro
                surface: {
                    0: '#ffffff', 50: '#f5f5f5', 100: '#e5e5e5', 200: '#c8c8c8', 300: '#a3a3a3', 400: '#8a8a8a',
                    500: '#5c5c5c', 600: '#3a3a3a', 700: '#2e2e2e', 800: '#1f1f1f', 900: '#171717', 950: '#0f0f0f'
                }
            }
        }
    }
});

export default SafeBusTheme;
