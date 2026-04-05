import { Box, Container, Flex, Grid, Heading, IconButton, Link, Separator, Text } from "@radix-ui/themes";
import { BusFrontIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MainFooter() {
    const { t } = useTranslation();

    return (
        <Box py="9" pb="5" style={{ backgroundColor: "var(--gray-3)", borderTop: "1px solid var(--gray-a4)" }}>
            <Container size="4" px="4">
                <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="6" mb="6">
                    <Box>
                        <Flex align="center" gap="2" mb="4">
                            <IconButton variant="soft" color="blue" size="2">
                                <BusFrontIcon size={20} />
                            </IconButton>
                            <Heading size="4" color="blue" weight="bold">
                                {t("header.brand")}
                            </Heading>
                        </Flex>
                        <Text size="2" color="gray" as="p" mb="2">
                            {t("footer.copyright")}
                        </Text>
                        <Text size="2" color="gray" as="p">
                            {t("footer.tagline")}
                        </Text>
                    </Box>

                    <Flex direction="column" gap="3">
                        <Heading size="3" highContrast>
                            {t("footer.about.title")}
                        </Heading>
                        <Link href="#" size="2" color="gray">
                            {t("footer.about.busSoftware")}
                        </Link>
                        <Link href="#" size="2" color="gray">
                            {t("footer.about.becomePartner")}
                        </Link>
                        <Link href="#" size="2" color="gray">
                            {t("footer.about.regulations")}
                        </Link>
                    </Flex>

                    <Flex direction="column" gap="3">
                        <Heading size="3" highContrast>
                            {t("footer.support.title")}
                        </Heading>
                        <Link href="#" size="2" color="gray">
                            {t("footer.support.bookingGuide")}
                        </Link>
                        <Link href="#" size="2" color="gray">
                            {t("footer.support.faq")}
                        </Link>
                        <Link href="#" size="2" color="gray">
                            {t("footer.support.privacy")}
                        </Link>
                    </Flex>
                </Grid>

                <Separator size="4" mb="5" color="gray" />

                <Text size="1" color="gray" align="center" as="div">
                    {t("footer.address")}
                </Text>
            </Container>
        </Box>
    );
}
