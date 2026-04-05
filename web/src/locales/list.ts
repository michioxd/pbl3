import LocaleEng from "@/locales/resources/en/index";
import LocaleVie from "@/locales/resources/vi/index";

export type LocaleResourcesType = {
    [key: string]: string | LocaleResourcesType;
};

export const LocalesResources = {
    vi: LocaleVie,
    en: LocaleEng,
};

export const knownLocales: Record<
    string,
    {
        name: string;
        code: string;
        code4: string;
        code4under: string;
    }
> = {
    "vi-VN": {
        name: "Tiếng Việt",
        code: "vi",
        code4: "vi-VN",
        code4under: "vi_VN",
    },
    "en-US": {
        name: "English",
        code: "en",
        code4: "en-US",
        code4under: "en_US",
    },
};
