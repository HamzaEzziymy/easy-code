import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const LOCALE_COOKIE = 'app_locale';
export const LOCALE_STORAGE_KEY = 'app.locale';

export const locales = [
    { code: 'en', dir: 'ltr', label: en.language.en },
    { code: 'fr', dir: 'ltr', label: fr.language.fr },
    { code: 'ar', dir: 'ltr', label: ar.language.ar },
];

const isSupported = (code) => locales.some((locale) => locale.code === code);

export function dirOf(code) {
    return locales.find((locale) => locale.code === code)?.dir ?? 'ltr';
}

function fromCookie() {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : null;
}

function detectLocale() {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) ?? fromCookie();

    if (isSupported(stored)) {
        return stored;
    }

    const browser = (navigator.language ?? 'en').slice(0, 2).toLowerCase();

    return isSupported(browser) ? browser : 'en';
}

export function applyLocale(code) {
    document.documentElement.lang = code;
    document.documentElement.dir = dirOf(code);
}

function persistLocale(code) {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        fr: { translation: fr },
        ar: { translation: ar },
    },
    lng: detectLocale(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (code) => {
    persistLocale(code);
    applyLocale(code);
});

applyLocale(i18n.language);

export default i18n;
