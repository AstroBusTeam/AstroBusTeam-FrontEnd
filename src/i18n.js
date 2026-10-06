import {createI18n} from "vue-i18n";
import en from "./locales/en.json";
import es from "./locales/es.json";

// configuración de idiomas, la app empieza en español
const i18n = createI18n({
    legacy: false,
    locale: 'es',
    fallbackLocale: 'es',
    messages: { en, es }
});

export default i18n;
