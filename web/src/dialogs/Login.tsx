import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Dialog, Flex, IconButton, Link, Tabs, Text, TextField } from "@radix-ui/themes";
import { ArrowLeft, KeyRound, LockKeyhole, Mail, UserRound, XIcon } from "lucide-react";

type AuthView = "login" | "register" | "forgot";

type LoginDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
    const { t } = useTranslation();
    const [view, setView] = useState<AuthView>("login");

    const meta = useMemo(() => {
        if (view === "register") {
            return {
                title: t("header.auth.register.title"),
                description: t("header.auth.register.description"),
                badge: t("header.auth.register.badge"),
            };
        }

        if (view === "forgot") {
            return {
                title: t("header.auth.forgot.title"),
                description: t("header.auth.forgot.description"),
                badge: t("header.auth.forgot.badge"),
            };
        }

        return {
            title: t("header.auth.login.title"),
            description: t("header.auth.login.description"),
            badge: t("header.auth.login.badge"),
        };
    }, [t, view]);

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            setView("login");
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Content maxWidth="520px" className="overflow-hidden p-0!">
                <Box className="bg-linear-to-br px-6 py-6 bg-gray-400/5 border-b border-gray-400/5">
                    <IconButton
                        size="2"
                        color="gray"
                        variant="ghost"
                        className="absolute! right-6!"
                        onClick={() => onOpenChange(false)}
                    >
                        <XIcon size={20} />
                    </IconButton>
                    <Dialog.Title>{meta.title}</Dialog.Title>
                    <Dialog.Description size="2" color="gray">
                        {meta.description}
                    </Dialog.Description>
                </Box>

                <Box className="px-6 pb-5">
                    {view === "forgot" ? (
                        <ForgotPasswordForm onBack={() => setView("login")} />
                    ) : (
                        <Tabs.Root
                            value={view}
                            onValueChange={(value) => setView(value as Exclude<AuthView, "forgot">)}
                        >
                            <Tabs.List size="2" color="blue" mb="5" className="w-full">
                                <Tabs.Trigger value="login" className="flex-1!">
                                    {t("header.auth.login.tab")}
                                </Tabs.Trigger>
                                <Tabs.Trigger value="register" className="flex-1!">
                                    {t("header.auth.register.tab")}
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="login">
                                <LoginForm
                                    onForgotPassword={() => setView("forgot")}
                                    onSwitchToRegister={() => setView("register")}
                                />
                            </Tabs.Content>
                            <Tabs.Content value="register">
                                <RegisterForm onSwitchToLogin={() => setView("login")} />
                            </Tabs.Content>
                        </Tabs.Root>
                    )}
                </Box>
            </Dialog.Content>
        </Dialog.Root>
    );
}

function LoginForm({
    onForgotPassword,
    onSwitchToRegister,
}: {
    onForgotPassword: () => void;
    onSwitchToRegister: () => void;
}) {
    const { t } = useTranslation();

    return (
        <Flex direction="column" gap="4">
            <FieldLabel label={t("header.auth.fields.email")}>
                <TextField.Root size="3" placeholder={t("header.auth.login.placeholders.email")}>
                    <TextField.Slot>
                        <Mail size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <FieldLabel label={t("header.auth.fields.password")}>
                <TextField.Root size="3" type="password" placeholder={t("header.auth.login.placeholders.password")}>
                    <TextField.Slot>
                        <LockKeyhole size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <Flex justify="between" align="center" gap="3" wrap="wrap">
                <Link
                    size="1"
                    onClick={(e) => {
                        e.preventDefault();
                        onForgotPassword();
                    }}
                    href="#"
                >
                    {t("header.auth.forgot.cta")}
                </Link>
            </Flex>

            <Button size="3">{t("header.auth.login.submit")}</Button>

            <FooterHint>
                <Text size="2" color="gray">
                    {t("header.auth.login.switchPrompt")}
                </Text>
                <Link
                    size="2"
                    onClick={(e) => {
                        e.preventDefault();
                        onSwitchToRegister();
                    }}
                    href="#"
                >
                    {t("header.auth.register.tab")}
                </Link>
            </FooterHint>
        </Flex>
    );
}

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
    const { t } = useTranslation();

    return (
        <Flex direction="column" gap="4">
            <FieldLabel label={t("header.auth.fields.fullName")}>
                <TextField.Root size="3" placeholder={t("header.auth.register.placeholders.fullName")}>
                    <TextField.Slot>
                        <UserRound size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <FieldLabel label={t("header.auth.fields.email")}>
                <TextField.Root size="3" placeholder={t("header.auth.register.placeholders.email")}>
                    <TextField.Slot>
                        <Mail size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <FieldLabel label={t("header.auth.fields.password")}>
                <TextField.Root size="3" type="password" placeholder={t("header.auth.register.placeholders.password")}>
                    <TextField.Slot>
                        <LockKeyhole size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <FieldLabel label={t("header.auth.fields.confirmPassword")}>
                <TextField.Root
                    size="3"
                    type="password"
                    placeholder={t("header.auth.register.placeholders.confirmPassword")}
                >
                    <TextField.Slot>
                        <KeyRound size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <Text size="2" color="gray">
                {t("header.auth.register.helper")}
            </Text>

            <Button size="3">{t("header.auth.register.submit")}</Button>

            <FooterHint>
                <Text size="2" color="gray">
                    {t("header.auth.register.switchPrompt")}
                </Text>
                <Link
                    size="2"
                    onClick={(e) => {
                        e.preventDefault();
                        onSwitchToLogin();
                    }}
                    href="#"
                >
                    {t("header.auth.login.tab")}
                </Link>
            </FooterHint>
        </Flex>
    );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation();

    return (
        <Flex direction="column" gap="4">
            <div>
                <Button size="1" color="gray" variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} />
                    {t("header.auth.forgot.back")}
                </Button>
            </div>

            <FieldLabel label={t("header.auth.fields.email")}>
                <TextField.Root size="3" placeholder={t("header.auth.forgot.placeholders.email")}>
                    <TextField.Slot>
                        <Mail size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <Text size="2" color="gray">
                {t("header.auth.forgot.helper")}
            </Text>

            <Button size="3">{t("header.auth.forgot.submit")}</Button>
        </Flex>
    );
}

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label>
            <Text as="div" size="2" mb="2" weight="bold">
                {label}
            </Text>
            {children}
        </label>
    );
}

function FooterHint({ children }: { children: ReactNode }) {
    return (
        <Flex
            justify="center"
            align="center"
            gap="1"
            wrap="wrap"
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "var(--gray-2)" }}
        >
            {children}
        </Flex>
    );
}
