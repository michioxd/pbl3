import { Button, DropdownMenu, Flex, Text, type ButtonProps } from "@radix-ui/themes";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import unknownFlag from "@/assets/unknown_flag.svg";
import { ChevronDownIcon } from "lucide-react";
import { knownLocales } from "@/locales/list";

function getLangInfo(localeCode: string) {
    try {
        const region = new Intl.Locale(localeCode).maximize().region;
        const languageName = new Intl.DisplayNames([localeCode], { type: "language" }).of(localeCode);
        const emoji = region?.toUpperCase().replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 0x1f1a5));
        let flag = null;

        try {
            const locale = new Intl.Locale(localeCode).maximize();
            flag = `https://flagcdn.com/${locale.region?.toLowerCase()}.svg`;
        } catch {
            flag = null;
        }

        return { name: languageName, emoji, flag };
    } catch {
        return {
            name: "English",
            emoji: "🇺🇸",
            flag: `https://flagcdn.com/us.svg`,
        };
    }
}

const LangItem = ({ lang }: { lang: (typeof knownLocales)[string] }) => {
    const { i18n } = useTranslation();
    const langInfo = useMemo(() => getLangInfo(lang.code4), [lang]);

    return (
        <DropdownMenu.Item key={lang.code4} onClick={() => i18n.changeLanguage(lang.code4)}>
            <Text weight={i18n.language === lang.code4 ? "bold" : "regular"}>
                <Flex gap="1" align="center">
                    {langInfo.flag && (
                        <img
                            style={{ width: 20, height: 13.33333333333333, objectFit: "cover" }}
                            onError={(e) => {
                                e.currentTarget.src = unknownFlag;
                                e.currentTarget.onerror = null;
                            }}
                            src={langInfo.flag}
                            alt={langInfo.name}
                        />
                    )}{" "}
                    {langInfo.name}
                </Flex>
            </Text>
        </DropdownMenu.Item>
    );
};

export function LangSelectorList() {
    return (
        <DropdownMenu.Content variant="soft">
            {Object.values(knownLocales).map((lc, index) => (
                <LangItem key={index} lang={lc} />
            ))}
        </DropdownMenu.Content>
    );
}

export const LangSelectorComponent = (
    props: DropdownMenu.RootProps & { minimal?: boolean; buttonProps?: ButtonProps },
) => {
    const { i18n } = useTranslation();

    const langInfo = useMemo(() => getLangInfo(i18n.language), [i18n.language]);

    return (
        <DropdownMenu.Root {...props}>
            <DropdownMenu.Trigger>
                <Button size="1" variant="soft" color="gray" {...props.buttonProps}>
                    {langInfo.flag && (
                        <img
                            style={{ width: 20, height: 13.33333333333333, objectFit: "cover" }}
                            onError={(e) => {
                                e.currentTarget.src = unknownFlag;
                                e.currentTarget.onerror = null;
                            }}
                            src={langInfo.flag}
                            alt={langInfo.name}
                        />
                    )}{" "}
                    {!props.minimal && langInfo.name}
                    {!props.minimal && <ChevronDownIcon size={16} />}
                </Button>
            </DropdownMenu.Trigger>
            <LangSelectorList />
        </DropdownMenu.Root>
    );
};
