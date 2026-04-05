import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import LanguageDetector from "i18next-browser-languagedetector";
import { LocalesResources } from "@/locales/list";

const resources = LocalesResources;
i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init(
        {
            resources,
            fallbackLng: "vi",
            supportedLngs: ["vi", "en"],
            nonExplicitSupportedLngs: true,
            detection: {
                lookupLocalStorage: "hl",
                lookupQuerystring: "hl",
                order: ["querystring", "localStorage", "navigator"],
            },
            debug: false,
            defaultNS: "common",

            interpolation: {
                escapeValue: false,
            },
        },
        () => {},
    );
