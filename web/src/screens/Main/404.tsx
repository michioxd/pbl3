import { Button, Heading, IconButton, Text } from "@radix-ui/themes";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Page404({ text1, text2 }: { text1?: string; text2?: string }) {
    const { t } = useTranslation();
    return (
        <>
            <div className="flex flex-col items-center justify-center w-full mt-30">
                <IconButton variant="soft" color="red" size="4" mb="8" className="scale-200!">
                    <XIcon size={32} />
                </IconButton>
                <Heading align="center">{t(text1 || "common:page_not_found")}</Heading>
                <Text color="gray" align="center" size="2" mt="1">
                    {t(text2 || "common:page_not_found_description")}
                </Text>
                <Button variant="soft" size="2" mt="4" asChild>
                    <Link to="/">
                        <ArrowLeftIcon />
                        {t("common:back_to_home")}
                    </Link>
                </Button>
            </div>
        </>
    );
}
