import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    Button,
    Callout,
    Dialog,
    Flex,
    IconButton,
    Link,
    Separator,
    Tabs,
    Text,
    TextField,
} from "@radix-ui/themes";
import { ArrowLeft, KeyRound, LockKeyhole, Mail, UserRound, XIcon } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useThemeContext } from "@/controller/ThemeProvider";
import { cn } from "@/lib/utils";
import { postApiAuthLogin, postApiAuthOauthGoogle, postApiAuthRegister } from "@/api";
import { toast } from "sonner";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useStore } from "@/stores";

type AuthView = "login" | "register" | "forgot";

type LoginDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type LoginError = {
    fullName?: string | null;
    email?: string | null;
    password?: string | null;
    confirmPassword?: string | null;
    global?: string | null;
};

type ApiErrorShape = {
    message?: string;
};

type SetLoginError = Dispatch<SetStateAction<LoginError>>;

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
    const store = useStore();
    const { t } = useTranslation();
    const [view, setView] = useState<AuthView>("login");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<LoginError>({});

    const clearError = useCallback(() => {
        setError({});
    }, []);

    const resolveAuthError = useCallback((value: unknown, fallback: string) => {
        if (value && typeof value === "object" && "message" in value) {
            const message = (value as ApiErrorShape).message;
            if (typeof message === "string" && message.length > 0) {
                return message;
            }
        }

        return fallback;
    }, []);

    const applyLoginError = useCallback((message: string) => {
        if (message === "auth:msg.invalid_credentials") {
            setError({ email: message, password: message, global: message });
            return;
        }

        setError({ global: message });
    }, []);

    const applyRegisterError = useCallback((message: string) => {
        if (message === "auth:msg.email_already_in_use") {
            setError({ email: message });
            return;
        }

        setError({ global: message });
    }, []);

    const meta = useMemo(() => {
        if (view === "register") {
            return {
                title: t("auth:register.title"),
                description: t("auth:register.description"),
                badge: t("auth:register.badge"),
            };
        }

        if (view === "forgot") {
            return {
                title: t("auth:forgot.title"),
                description: t("auth:forgot.description"),
                badge: t("auth:forgot.badge"),
            };
        }

        return {
            title: t("auth:login.title"),
            description: t("auth:login.description"),
            badge: t("auth:login.badge"),
        };
    }, [t, view]);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            onOpenChange(nextOpen);
            if (!nextOpen) {
                setView("login");
                clearError();
            }
        },
        [clearError, onOpenChange],
    );

    const handleGoogleLogin = useCallback(
        async (creds: string) => {
            if (!creds) return;

            setIsLoading(true);
            clearError();
            try {
                const response = await postApiAuthOauthGoogle({
                    body: {
                        idToken: creds,
                    },
                });

                if (!response.data?.token) {
                    throw new Error("No token received from Google login");
                }

                if (!(await store.user.login(response.data.token))) {
                    throw new Error("Authentication failed after Google login");
                }
                setIsLoading(false);
                toast.success(t("auth:google.success"));
                handleOpenChange(false);
            } catch (e: any) {
                console.error("Google login failed", e);
                setError((prev) => ({ ...prev, global: "auth:google.failed" }));
            } finally {
                setIsLoading(false);
            }
        },
        [clearError, handleOpenChange, store.user, t],
    );

    const handleLogin = useCallback(
        async (email: string, password: string) => {
            const trimmedEmail = email.trim();
            const nextError: LoginError = {};

            if (!trimmedEmail) {
                nextError.email = "common:unauthorized";
            }

            if (!password) {
                nextError.password = "common:unauthorized";
            }

            if (Object.keys(nextError).length > 0) {
                setError(nextError);
                return;
            }

            setIsLoading(true);
            clearError();

            try {
                const response = await postApiAuthLogin({
                    body: {
                        email: trimmedEmail,
                        password,
                    },
                });

                if (response.error) {
                    applyLoginError(resolveAuthError(response.error, "common:unknown_error"));
                    return;
                }

                if (!response.data?.token) {
                    throw new Error("No token received from login");
                }

                if (!(await store.user.login(response.data.token))) {
                    throw new Error("Authentication failed after login");
                }

                toast.success(t("auth:login.success"));
                handleOpenChange(false);
            } catch (e: any) {
                console.error("Login failed", e);
                applyLoginError(resolveAuthError(e, "common:unknown_error"));
            } finally {
                setIsLoading(false);
            }
        },
        [applyLoginError, clearError, handleOpenChange, resolveAuthError, store.user, t],
    );

    const handleRegister = useCallback(
        async (fullName: string, email: string, password: string, confirmPassword: string) => {
            const trimmedFullName = fullName.trim();
            const trimmedEmail = email.trim();
            const nextError: LoginError = {};

            if (!trimmedFullName) {
                nextError.fullName = "common:unauthorized";
            }

            if (!trimmedEmail) {
                nextError.email = "common:unauthorized";
            }

            if (!password) {
                nextError.password = "common:unauthorized";
            }

            if (!confirmPassword) {
                nextError.confirmPassword = "common:unauthorized";
            } else if (password !== confirmPassword) {
                nextError.confirmPassword = "auth:msg.password_mismatch";
            }

            if (Object.keys(nextError).length > 0) {
                setError(nextError);
                return;
            }

            setIsLoading(true);
            clearError();

            try {
                const response = await postApiAuthRegister({
                    body: {
                        fullName: trimmedFullName,
                        email: trimmedEmail,
                        password,
                    },
                });

                if (response.error) {
                    applyRegisterError(resolveAuthError(response.error, "common:unknown_error"));
                    return;
                }

                if (!response.data?.token) {
                    throw new Error("No token received from register");
                }

                if (!(await store.user.login(response.data.token))) {
                    throw new Error("Authentication failed after register");
                }

                toast.success(t("auth:register.success"));
                handleOpenChange(false);
            } catch (e: any) {
                console.error("Register failed", e);
                applyRegisterError(resolveAuthError(e, "common:unknown_error"));
            } finally {
                setIsLoading(false);
            }
        },
        [applyRegisterError, clearError, handleOpenChange, resolveAuthError, store.user, t],
    );

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
                                    {t("auth:login.tab")}
                                </Tabs.Trigger>
                                <Tabs.Trigger value="register" className="flex-1!">
                                    {t("auth:register.tab")}
                                </Tabs.Trigger>
                            </Tabs.List>
                            {error.global && (
                                <Callout.Root color="red" size="1" mb="2" className="flex! items-center! gap-2 w-full!">
                                    <Callout.Icon>
                                        <ExclamationTriangleIcon />
                                    </Callout.Icon>
                                    <Callout.Text className="flex! items-center! gap-2 w-full!">
                                        {error.global && t(error.global)}
                                        <span className="flex-1 flex"></span>
                                        <IconButton size="1" variant="soft">
                                            <XIcon
                                                size={12}
                                                onClick={() => setError((prev) => ({ ...prev, global: null }))}
                                            />
                                        </IconButton>
                                    </Callout.Text>
                                </Callout.Root>
                            )}
                            <Tabs.Content value="login">
                                <LoginForm
                                    onForgotPassword={() => setView("forgot")}
                                    onSwitchToRegister={() => setView("register")}
                                    isLoading={isLoading}
                                    setIsLoading={setIsLoading}
                                    handleGoogleLogin={handleGoogleLogin}
                                    handleLogin={handleLogin}
                                    error={error}
                                    setError={setError}
                                />
                            </Tabs.Content>
                            <Tabs.Content value="register">
                                <RegisterForm
                                    onSwitchToLogin={() => setView("login")}
                                    isLoading={isLoading}
                                    setIsLoading={setIsLoading}
                                    handleGoogleLogin={handleGoogleLogin}
                                    handleRegister={handleRegister}
                                    error={error}
                                    setError={setError}
                                />
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
    isLoading,
    // setIsLoading,
    handleGoogleLogin,
    handleLogin,
    error,
    setError,
}: {
    onForgotPassword: () => void;
    onSwitchToRegister: () => void;
    isLoading: boolean;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    handleGoogleLogin: (creds: string) => Promise<void>;
    handleLogin: (email: string, password: string) => Promise<void>;
    error: LoginError;
    setError: SetLoginError;
}) {
    const { t } = useTranslation();
    const { mode } = useThemeContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <Flex direction="column" gap="4">
            <div
                className={cn(
                    "flex justify-center items-center w-full gbtn",
                    isLoading && "opacity-50 pointer-events-none",
                )}
                style={{
                    colorScheme: "light",
                }}
            >
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        handleGoogleLogin(credentialResponse.credential!);
                    }}
                    onError={() => {
                        setError((prev) => ({ ...prev, global: "auth:google.failed" }));
                    }}
                    theme={mode === 1 ? "filled_black" : "filled_blue"}
                    size="large"
                    width="100%"
                    useOneTap
                    text={"signin_with"}
                    logo_alignment="center"
                />
            </div>
            <Flex align="center" gap="3" className="w-full">
                <Separator size="4" className="flex-1" />
                <Text size="1" color="gray" weight="medium" className="uppercase!">
                    {t("common:or")}
                </Text>
                <Separator size="4" className="flex-1" />
            </Flex>
            <FieldLabel label={t("auth:fields.email")}>
                <TextField.Root
                    size="3"
                    placeholder={t("auth:login.placeholders.email")}
                    value={email}
                    disabled={isLoading}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError((prev) => ({ ...prev, email: null, global: null }));
                    }}
                >
                    <TextField.Slot>
                        <Mail size={16} />
                    </TextField.Slot>
                </TextField.Root>
                {error.email && (
                    <Text size="1" color="red">
                        {t(error.email)}
                    </Text>
                )}
            </FieldLabel>

            <FieldLabel label={t("auth:fields.password")}>
                <TextField.Root
                    size="3"
                    type="password"
                    placeholder={t("auth:login.placeholders.password")}
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError((prev) => ({ ...prev, password: null, global: null }));
                    }}
                >
                    <TextField.Slot>
                        <LockKeyhole size={16} />
                    </TextField.Slot>
                </TextField.Root>
                {error.password && (
                    <Text size="1" color="red">
                        {t(error.password)}
                    </Text>
                )}
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
                    {t("auth:forgot.cta")}
                </Link>
            </Flex>

            <Button size="3" disabled={isLoading} loading={isLoading} onClick={() => handleLogin(email, password)}>
                {t("auth:login.submit")}
            </Button>

            <FooterHint>
                <Text size="2" color="gray">
                    {t("auth:login.switchPrompt")}
                </Text>
                <Link
                    size="2"
                    onClick={(e) => {
                        e.preventDefault();
                        onSwitchToRegister();
                    }}
                    href="#"
                >
                    {t("auth:register.tab")}
                </Link>
            </FooterHint>
        </Flex>
    );
}

function RegisterForm({
    onSwitchToLogin,
    isLoading,
    handleGoogleLogin,
    handleRegister,
    setError,
    error,
}: {
    onSwitchToLogin: () => void;
    isLoading: boolean;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    handleGoogleLogin: (creds: string) => Promise<void>;
    handleRegister: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>;
    setError: SetLoginError;
    error: LoginError;
}) {
    const { t } = useTranslation();
    const { mode } = useThemeContext();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    return (
        <Flex direction="column" gap="4">
            <div
                className={cn(
                    "flex justify-center items-center w-full gbtn",
                    isLoading && "opacity-50 pointer-events-none",
                )}
                style={{
                    colorScheme: "light",
                }}
            >
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        handleGoogleLogin(credentialResponse.credential!);
                    }}
                    onError={() => {
                        setError((prev) => ({ ...prev, global: "auth:google.failed" }));
                    }}
                    theme={mode === 1 ? "filled_black" : "filled_blue"}
                    size="large"
                    width="100%"
                    useOneTap
                    text={"signup_with"}
                    logo_alignment="center"
                />
            </div>
            <Flex align="center" gap="3" className="w-full">
                <Separator size="4" className="flex-1" />
                <Text size="1" color="gray" weight="medium" className="uppercase!">
                    {t("common:or")}
                </Text>
                <Separator size="4" className="flex-1" />
            </Flex>
            <FieldLabel label={t("auth:fields.fullName")}>
                <TextField.Root
                    size="3"
                    placeholder={t("auth:register.placeholders.fullName")}
                    value={fullName}
                    disabled={isLoading}
                    onChange={(e) => {
                        setFullName(e.target.value);
                        setError((prev) => ({ ...prev, fullName: null, global: null }));
                    }}
                >
                    <TextField.Slot>
                        <UserRound size={16} />
                    </TextField.Slot>
                </TextField.Root>
                {error.fullName && (
                    <Text size="1" color="red">
                        {t(error.fullName)}
                    </Text>
                )}
            </FieldLabel>

            <FieldLabel label={t("auth:fields.email")}>
                <TextField.Root
                    size="3"
                    placeholder={t("auth:register.placeholders.email")}
                    value={email}
                    disabled={isLoading}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError((prev) => ({ ...prev, email: null, global: null }));
                    }}
                >
                    <TextField.Slot>
                        <Mail size={16} />
                    </TextField.Slot>
                </TextField.Root>
                {error.email && (
                    <Text size="1" color="red">
                        {t(error.email)}
                    </Text>
                )}
            </FieldLabel>

            <FieldLabel label={t("auth:fields.password")}>
                <TextField.Root
                    size="3"
                    type="password"
                    placeholder={t("auth:register.placeholders.password")}
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError((prev) => ({ ...prev, password: null, global: null }));
                    }}
                >
                    <TextField.Slot>
                        <LockKeyhole size={16} />
                    </TextField.Slot>
                </TextField.Root>
                {error.password && (
                    <Text size="1" color="red">
                        {t(error.password)}
                    </Text>
                )}
            </FieldLabel>

            <FieldLabel label={t("auth:fields.confirmPassword")}>
                <TextField.Root
                    size="3"
                    type="password"
                    placeholder={t("auth:register.placeholders.confirmPassword")}
                    value={confirmPassword}
                    disabled={isLoading}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError((prev) => ({ ...prev, confirmPassword: null, global: null }));
                    }}
                >
                    <TextField.Slot>
                        <KeyRound size={16} />
                    </TextField.Slot>
                </TextField.Root>
                {error.confirmPassword && (
                    <Text size="1" color="red">
                        {t(error.confirmPassword)}
                    </Text>
                )}
            </FieldLabel>

            <Text size="2" color="gray">
                {t("auth:register.helper")}
            </Text>

            <Button
                size="3"
                disabled={isLoading}
                loading={isLoading}
                onClick={() => handleRegister(fullName, email, password, confirmPassword)}
            >
                {t("auth:register.submit")}
            </Button>

            <FooterHint>
                <Text size="2" color="gray">
                    {t("auth:register.switchPrompt")}
                </Text>
                <Link
                    size="2"
                    onClick={(e) => {
                        e.preventDefault();
                        onSwitchToLogin();
                    }}
                    href="#"
                >
                    {t("auth:login.tab")}
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
                    {t("auth:forgot.back")}
                </Button>
            </div>

            <FieldLabel label={t("auth:fields.email")}>
                <TextField.Root size="3" placeholder={t("auth:forgot.placeholders.email")}>
                    <TextField.Slot>
                        <Mail size={16} />
                    </TextField.Slot>
                </TextField.Root>
            </FieldLabel>

            <Text size="2" color="gray">
                {t("auth:forgot.helper")}
            </Text>

            <Button size="3">{t("auth:forgot.submit")}</Button>
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
