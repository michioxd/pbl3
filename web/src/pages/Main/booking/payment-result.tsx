import { getApiPaymentsMomoIntentsByIntentId } from "@/api";
import LoginDialog from "@/dialogs/Login";
import { useStore } from "@/stores";
import { Badge, Box, Button, Card, Container, Flex, Heading, Spinner, Text } from "@radix-ui/themes";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearPendingMomoPayment, getPendingMomoPayment } from "./payment-session";
import { formatCurrency, parseApiErrorMessage } from "./utils";

const PAYMENT_STATUS_SUCCEEDED = 1;
const PAYMENT_STATUS_FAILED = 2;
const BOOKING_STATUS_PAID = 1;

type PaymentResultViewState = "loading" | "success" | "pending" | "failed" | "missing" | "login";

type PaymentStatusPayload = {
    intentId: string;
    bookingId?: string | null;
    status?: number | null;
    bookingStatus?: number | null;
    amount?: number | null;
    currency?: string | null;
    message?: string | null;
    paidAt?: string | null;
};

function readString(value: unknown) {
    return typeof value === "string" ? value : null;
}

function readNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parsePaymentStatusPayload(payload: unknown): PaymentStatusPayload | null {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const response = payload as Record<string, unknown>;
    const intentId = readString(response.intentId);

    if (!intentId) {
        return null;
    }

    return {
        intentId,
        bookingId: readString(response.bookingId),
        status: readNumber(response.status),
        bookingStatus: readNumber(response.bookingStatus),
        amount: readNumber(response.amount),
        currency: readString(response.currency),
        message: readString(response.message),
        paidAt: readString(response.paidAt),
    };
}

const PageBookingPaymentResult = observer(() => {
    const store = useStore();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation("booking");
    const [searchParams] = useSearchParams();
    const [viewState, setViewState] = useState<PaymentResultViewState>("loading");
    const [payment, setPayment] = useState<PaymentStatusPayload | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const pendingPayment = useMemo(() => getPendingMomoPayment(), []);
    const queryIntentId = useMemo(() => searchParams.get("intentId"), [searchParams]);
    const queryBookingId = useMemo(() => searchParams.get("bookingId"), [searchParams]);
    const resultCode = useMemo(() => {
        const value = searchParams.get("resultCode");
        if (!value) {
            return null;
        }

        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : null;
    }, [searchParams]);
    const queryMessage = useMemo(() => searchParams.get("message"), [searchParams]);
    const queryOrderId = useMemo(() => searchParams.get("orderId"), [searchParams]);
    const resolvedIntentId = queryIntentId || pendingPayment?.intentId || null;
    const resolvedBookingId = queryBookingId || pendingPayment?.bookingId || null;

    useEffect(() => {
        if (store.user.isLoading) {
            return;
        }

        if (!store.user.isAuthenticated) {
            setViewState("login");
            setAuthDialogOpen(true);
            return;
        }

        if (!resolvedIntentId) {
            setMessage(resultCode !== null && resultCode !== 0 ? queryMessage : null);
            setViewState(resultCode !== null && resultCode !== 0 ? "failed" : "missing");
            return;
        }

        if (queryOrderId && pendingPayment?.orderId && queryOrderId !== pendingPayment.orderId) {
            clearPendingMomoPayment();
            setMessage(t("payment_result_missing_desc"));
            setViewState("missing");
            return;
        }

        let active = true;

        const fetchPaymentStatus = async () => {
            setViewState("loading");

            try {
                const response = await getApiPaymentsMomoIntentsByIntentId({
                    path: { intentId: resolvedIntentId },
                });

                if (!active) {
                    return;
                }

                if (response.error || !response.data) {
                    throw response.error ?? new Error(t("payment_result_missing_desc"));
                }

                const paymentStatus = parsePaymentStatusPayload(response.data);
                if (!paymentStatus) {
                    throw new Error(t("payment_result_missing_desc"));
                }

                setPayment(paymentStatus);
                if (!paymentStatus.bookingId && resolvedBookingId) {
                    paymentStatus.bookingId = resolvedBookingId;
                }
                setMessage(paymentStatus.message || queryMessage);

                if (
                    paymentStatus.status === PAYMENT_STATUS_SUCCEEDED ||
                    paymentStatus.bookingStatus === BOOKING_STATUS_PAID
                ) {
                    clearPendingMomoPayment();
                    setViewState("success");
                    return;
                }

                if (paymentStatus.status === PAYMENT_STATUS_FAILED || (resultCode !== null && resultCode !== 0)) {
                    clearPendingMomoPayment();
                    setViewState("failed");
                    return;
                }

                setViewState("pending");
            } catch (fetchError) {
                if (!active) {
                    return;
                }

                const errorMessage = parseApiErrorMessage(fetchError, t("payment_result_missing_desc"));
                setMessage(errorMessage);
                setViewState(resultCode !== null && resultCode !== 0 ? "failed" : "missing");
            }
        };

        void fetchPaymentStatus();

        return () => {
            active = false;
        };
    }, [
        queryMessage,
        queryOrderId,
        reloadKey,
        resultCode,
        resolvedBookingId,
        resolvedIntentId,
        store.user.isAuthenticated,
        store.user.isLoading,
        t,
    ]);

    const paidAtLabel = useMemo(() => {
        if (!payment?.paidAt) {
            return null;
        }

        const date = new Date(payment.paidAt);
        if (Number.isNaN(date.getTime())) {
            return payment.paidAt;
        }

        return format(date, "HH:mm, dd/MM/yyyy", i18n.language.startsWith("vi") ? { locale: vi } : undefined);
    }, [i18n.language, payment?.paidAt]);

    const stateContent = useMemo(() => {
        switch (viewState) {
            case "success":
                return {
                    badgeColor: "green" as const,
                    badgeLabel: t("payment_result_success_badge"),
                    cardClassName: "border border-(--green-a6) bg-(--green-2)",
                    title: t("payment_result_success_title"),
                    description: t("payment_result_success_desc"),
                };
            case "pending":
                return {
                    badgeColor: "amber" as const,
                    badgeLabel: t("payment_result_pending_badge"),
                    cardClassName: "border border-(--amber-a6) bg-(--amber-2)",
                    title: t("payment_result_pending_title"),
                    description: t("payment_result_pending_desc"),
                };
            case "failed":
                return {
                    badgeColor: "red" as const,
                    badgeLabel: t("payment_result_failed_badge"),
                    cardClassName: "border border-(--red-a6) bg-(--red-2)",
                    title: t("payment_result_failed_title"),
                    description: t("payment_result_failed_desc"),
                };
            case "missing":
                return {
                    badgeColor: "gray" as const,
                    badgeLabel: null,
                    cardClassName: "border border-(--gray-a4)",
                    title: t("payment_result_missing_title"),
                    description: t("payment_result_missing_desc"),
                };
            case "login":
                return {
                    badgeColor: "gray" as const,
                    badgeLabel: null,
                    cardClassName: "border border-(--gray-a4)",
                    title: t("payment_result_login_title"),
                    description: t("payment_result_login_desc"),
                };
            default:
                return {
                    badgeColor: "gray" as const,
                    badgeLabel: null,
                    cardClassName: "border border-(--gray-a4)",
                    title: t("payment_result_loading_title"),
                    description: t("payment_result_loading_desc"),
                };
        }
    }, [t, viewState]);

    const handleRetry = () => {
        if (pendingPayment?.tripId) {
            navigate(`/booking/${pendingPayment.tripId}`);
            return;
        }

        navigate("/");
    };

    return (
        <Box className="bg-(--gray-2)" style={{ minHeight: "100%" }}>
            <Container size="2" px="4" py="8">
                <Flex direction="column" gap="4">
                    <Heading size="7">{t("payment_result_page_title")}</Heading>

                    <Card size="4" className={stateContent.cardClassName}>
                        <Flex direction="column" gap="4">
                            {viewState === "loading" ? (
                                <Flex align="center" gap="3">
                                    <Spinner size="3" />
                                    <Text size="2" color="gray">
                                        {stateContent.description}
                                    </Text>
                                </Flex>
                            ) : (
                                <>
                                    {stateContent.badgeLabel ? (
                                        <Badge color={stateContent.badgeColor} variant="soft" size="2">
                                            {stateContent.badgeLabel}
                                        </Badge>
                                    ) : null}

                                    <Box>
                                        <Heading size="5" mb="2">
                                            {stateContent.title}
                                        </Heading>
                                        <Text size="2" color="gray">
                                            {stateContent.description}
                                        </Text>
                                    </Box>
                                </>
                            )}

                            {message ? (
                                <Card variant="surface" className="border border-(--gray-a4)">
                                    <Text as="div" size="2" color="gray" mb="1">
                                        {t("payment_result_message_label")}
                                    </Text>
                                    <Text size="2">{message}</Text>
                                </Card>
                            ) : null}

                            {payment ? (
                                <Card variant="surface" className="border border-(--gray-a4)">
                                    <Flex direction="column" gap="3">
                                        <Flex justify="between" gap="3" wrap="wrap">
                                            <Text size="2" color="gray">
                                                {t("payment_result_booking_id_label")}
                                            </Text>
                                            <Text size="2" weight="medium">
                                                {payment.bookingId ?? "--"}
                                            </Text>
                                        </Flex>

                                        <Flex justify="between" gap="3" wrap="wrap">
                                            <Text size="2" color="gray">
                                                {t("payment_result_intent_id_label")}
                                            </Text>
                                            <Text size="2" weight="medium">
                                                {payment.intentId}
                                            </Text>
                                        </Flex>

                                        <Flex justify="between" gap="3" wrap="wrap">
                                            <Text size="2" color="gray">
                                                {t("payment_result_amount_label")}
                                            </Text>
                                            <Text size="2" weight="medium">
                                                {formatCurrency(payment.amount ?? undefined)}
                                            </Text>
                                        </Flex>

                                        {paidAtLabel ? (
                                            <Flex justify="between" gap="3" wrap="wrap">
                                                <Text size="2" color="gray">
                                                    {t("payment_result_paid_at_label")}
                                                </Text>
                                                <Text size="2" weight="medium">
                                                    {paidAtLabel}
                                                </Text>
                                            </Flex>
                                        ) : null}
                                    </Flex>
                                </Card>
                            ) : null}

                            <Flex gap="3" wrap="wrap">
                                {viewState === "login" ? (
                                    <Button onClick={() => setAuthDialogOpen(true)}>{t("action_open_login")}</Button>
                                ) : (
                                    <>
                                        <Button onClick={() => navigate("/orders")}>
                                            {t("payment_result_action_orders")}
                                        </Button>

                                        {viewState === "pending" ? (
                                            <Button
                                                variant="soft"
                                                color="amber"
                                                onClick={() => setReloadKey((current) => current + 1)}
                                            >
                                                {t("payment_result_action_refresh")}
                                            </Button>
                                        ) : null}

                                        {viewState === "failed" || viewState === "missing" ? (
                                            <Button variant="soft" color="gray" onClick={handleRetry}>
                                                {t("payment_result_action_retry")}
                                            </Button>
                                        ) : null}
                                    </>
                                )}
                            </Flex>
                        </Flex>
                    </Card>
                </Flex>
            </Container>

            <LoginDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </Box>
    );
});

export default PageBookingPaymentResult;
