import { postApiPassengerUpgradeRequestsBusadmin } from "@/api";
import type { CreateBusAdminUpgradeRequestDto } from "@/api";
import { Container, Heading, Flex, Text, Card, Button, TextField, TextArea, Callout, Box } from "@radix-ui/themes";
import { observer } from "mobx-react-lite";
import { InfoCircledIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/stores";
import LoginDialog from "@/dialogs/Login";

const PagePartnerRegistration = observer(() => {
    const store = useStore();
    const { t } = useTranslation("partnerRegistration");
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const [formData, setFormData] = useState<CreateBusAdminUpgradeRequestDto>({
        companyName: "",
        licenseNumber: "",
        hotline: "",
        reason: "",
    });
    const [errors, setErrors] = useState<{ companyName?: string }>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!store.user.isAuthenticated && !store.user.isLoading) {
            setAuthDialogOpen(true);
        }
    }, [store.user.isAuthenticated, store.user.isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName.trim()) {
            setErrors({ companyName: t("validation.company_name_required") });
            return;
        }

        setErrors({});
        setIsLoading(true);
        setIsError(false);
        try {
            await postApiPassengerUpgradeRequestsBusadmin({ body: formData });
            setIsSuccess(true);
        } catch (err) {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (store.user.isLoading) {
        return (
            <Container size="2" px="4" py="8">
                <Text>{t("loading")}</Text>
            </Container>
        );
    }

    if (!store.user.isAuthenticated) {
        return (
            <Container size="2" px="4" py="8">
                <Card size="4">
                    <Flex direction="column" align="center" gap="4">
                        <Heading size="6">{t("login_required_title")}</Heading>
                        <Text color="gray">{t("login_required_desc")}</Text>
                        <Button onClick={() => setAuthDialogOpen(true)}>{t("login_required_cta")}</Button>
                    </Flex>
                </Card>
                <LoginDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
            </Container>
        );
    }

    if (isSuccess) {
        return (
            <Container size="2" px="4" py="8">
                <Callout.Root color="green">
                    <Callout.Icon>
                        <CheckCircledIcon />
                    </Callout.Icon>
                    <Callout.Text>{t("success")}</Callout.Text>
                </Callout.Root>
            </Container>
        );
    }

    return (
        <Container size="2" px="4" py="8">
            <Card size="4">
                <Heading size="6" mb="4">
                    {t("title")}
                </Heading>
                <Text color="gray" mb="6" as="p">
                    {t("description")}
                </Text>

                {isError && (
                    <Callout.Root color="red" mb="5">
                        <Callout.Icon>
                            <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>{t("error")}</Callout.Text>
                    </Callout.Root>
                )}

                <form onSubmit={handleSubmit}>
                    <Flex direction="column" gap="4">
                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                {t("fields.company_name")} <Text color="red">*</Text>
                            </Text>
                            <TextField.Root
                                placeholder={t("placeholders.company_name")}
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            />
                            {errors.companyName && (
                                <Text color="red" size="1" mt="1">
                                    {errors.companyName}
                                </Text>
                            )}
                        </Box>

                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                {t("fields.license_number")}
                            </Text>
                            <TextField.Root
                                placeholder={t("placeholders.license_number")}
                                value={formData.licenseNumber || ""}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </Box>

                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                {t("fields.hotline")}
                            </Text>
                            <TextField.Root
                                placeholder={t("placeholders.hotline")}
                                value={formData.hotline || ""}
                                onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                            />
                        </Box>

                        <Box>
                            <Text as="label" size="2" weight="bold" mb="2" style={{ display: "block" }}>
                                {t("fields.reason")}
                            </Text>
                            <TextArea
                                placeholder={t("placeholders.reason")}
                                rows={4}
                                value={formData.reason || ""}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </Box>

                        <Flex justify="end" mt="4">
                            <Button type="submit" loading={isLoading}>
                                {t("submit")}
                            </Button>
                        </Flex>
                    </Flex>
                </form>
            </Card>
        </Container>
    );
});

export default PagePartnerRegistration;
