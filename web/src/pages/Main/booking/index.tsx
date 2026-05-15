import { getApiTripsByTripId, postApiBookings, postApiPaymentsMomoCreate } from "@/api";
import type { PaymentProvider, TripDetailDto } from "@/api";
import BookingAddressStep from "./components/BookingAddressStep";
import BookingConfirmStep from "./components/BookingConfirmStep";
import BookingLoginPrompt from "./components/BookingLoginPrompt";
import BookingPaymentStep from "./components/BookingPaymentStep";
import BookingStepper from "./components/BookingStepper";
import BookingSummaryCard from "./components/BookingSummaryCard";
import BookingTripCard from "./components/BookingTripCard";
import type { BookingFormState, BookingStep, PaymentOption, StepItem, StopOption } from "./types";
import { formatCurrency, formatDurationLabel, parseApiErrorMessage } from "./utils";
import LoginDialog from "@/dialogs/Login";
import { useStore } from "@/stores";
import { Box, Button, Card, Container, Flex, Grid, Heading, Skeleton, Text } from "@radix-ui/themes";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { observer } from "mobx-react-lite";
import { ArrowLeft, Building2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const INITIAL_FORM: BookingFormState = {
    fullName: "",
    phoneNumber: "",
    email: "",
    pickupStopId: "",
    dropoffStopId: "",
    addressNote: "",
    paymentProvider: 0,
};

const MOMO_PAYMENT_PROVIDER = 0 as PaymentProvider;
const CASH_PAYMENT_PROVIDER = 2 as PaymentProvider;

function getMomoRedirectUrl(payload: unknown) {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const response = payload as {
        payUrl?: string | null;
        deeplink?: string | null;
        qrCodeUrl?: string | null;
    };

    return response.payUrl || response.deeplink || response.qrCodeUrl || null;
}

const PageMainBooking = observer(() => {
    const store = useStore();
    const navigate = useNavigate();
    const { tripId } = useParams();
    const { t, i18n } = useTranslation("booking");
    const [trip, setTrip] = useState<TripDetailDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<BookingStep>(0);
    const [form, setForm] = useState<BookingFormState>(INITIAL_FORM);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [hasPromptedLogin, setHasPromptedLogin] = useState(false);
    const [demoCompleted, setDemoCompleted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const stepItems = useMemo<StepItem[]>(
        () => [
            { value: 0 as BookingStep, label: t("step_address") },
            { value: 1 as BookingStep, label: t("step_payment") },
            { value: 2 as BookingStep, label: t("step_confirm") },
        ],
        [t],
    );

    const paymentOptions = useMemo<PaymentOption[]>(
        () => [
            {
                value: MOMO_PAYMENT_PROVIDER,
                title: t("payment_option_momo_title"),
                description: t("payment_option_momo_desc"),
                badge: t("payment_badge_recommended"),
                Icon: Wallet,
            },
            {
                value: CASH_PAYMENT_PROVIDER,
                title: t("payment_option_counter_title"),
                description: t("payment_option_counter_desc"),
                badge: t("payment_badge_flexible"),
                Icon: Building2,
            },
        ],
        [t],
    );

    const pickupOptions = useMemo<StopOption[]>(() => {
        return (trip?.pickupStops ?? []).map((stop, index) => ({
            value: stop.stationId?.trim() || `pickup-${index}`,
            label: stop.stationName?.trim() || `${t("stop_not_available")} ${index + 1}`,
            secondary: stop.addressDetail?.trim() || "",
            stop,
        }));
    }, [t, trip?.pickupStops]);

    const dropoffOptions = useMemo<StopOption[]>(() => {
        return (trip?.dropoffStops ?? []).map((stop, index) => ({
            value: stop.stationId?.trim() || `dropoff-${index}`,
            label: stop.stationName?.trim() || `${t("stop_not_available")} ${index + 1}`,
            secondary: stop.addressDetail?.trim() || "",
            stop,
        }));
    }, [t, trip?.dropoffStops]);

    const selectedPickup = pickupOptions.find((option) => option.value === form.pickupStopId);
    const selectedDropoff = dropoffOptions.find((option) => option.value === form.dropoffStopId);
    const selectedPayment = paymentOptions.find((option) => option.value === form.paymentProvider);
    const totalPrice = trip?.basePrice ?? trip?.lowestPrice;
    const routeFallbackLabel = [trip?.pickupStops?.[0]?.stationName, trip?.dropoffStops?.at(-1)?.stationName]
        .filter(Boolean)
        .join(" → ");
    const routeLabel = trip?.routeName ?? (routeFallbackLabel || "--");

    useEffect(() => {
        if (!tripId) {
            setError(t("page_missing_trip"));
            return;
        }

        let active = true;

        const fetchTrip = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await getApiTripsByTripId({ path: { tripId } });

                if (!active) {
                    return;
                }

                if (response.error || !response.data) {
                    throw response.error ?? new Error(t("page_fetch_error"));
                }

                setTrip(response.data);
            } catch (fetchError) {
                if (!active) {
                    return;
                }

                const message = parseApiErrorMessage(fetchError, t("page_fetch_error"));
                setError(message);
                setTrip(null);
                toast.error(message);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void fetchTrip();

        return () => {
            active = false;
        };
    }, [t, tripId]);

    useEffect(() => {
        setForm((current) => ({
            ...current,
            fullName:
                current.fullName ||
                store.user?.user?.currentPassenger.fullName ||
                store.user?.user?.currentUser.fullName ||
                "",
            phoneNumber:
                current.phoneNumber ||
                store.user?.user?.currentPassenger.phoneNumber ||
                store.user?.user?.currentUser.phoneNumber ||
                "",
            email:
                current.email ||
                store.user?.user?.currentPassenger.email ||
                store.user?.user?.currentUser.email ||
                store.user?.user?.email ||
                "",
            pickupStopId: current.pickupStopId || pickupOptions[0]?.value || "",
            dropoffStopId: current.dropoffStopId || dropoffOptions[0]?.value || "",
        }));
    }, [dropoffOptions, pickupOptions, store.user]);

    useEffect(() => {
        if (!hasPromptedLogin && !store.user.isLoading && !store.user.isAuthenticated) {
            setAuthDialogOpen(true);
            setHasPromptedLogin(true);
        }
    }, [hasPromptedLogin, store.user.isAuthenticated, store.user.isLoading]);

    const formatDateTimeLabel = (value?: string) => {
        if (!value) {
            return "--";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return format(date, "HH:mm, dd/MM/yyyy", i18n.language.startsWith("vi") ? { locale: vi } : undefined);
    };

    const formatTimeLabel = (value?: string) => {
        if (!value) {
            return "--";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return format(date, "HH:mm");
    };

    const updateField = <K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const validateStep = (step: BookingStep) => {
        if (step === 0) {
            if (!store.user.isAuthenticated) {
                setAuthDialogOpen(true);
                return false;
            }

            if (
                !form.fullName.trim() ||
                !form.phoneNumber.trim() ||
                !form.email.trim() ||
                !form.pickupStopId ||
                !form.dropoffStopId
            ) {
                toast.error(t("validation_address"));
                return false;
            }
        }

        if (step === 1 && form.paymentProvider === undefined) {
            toast.error(t("validation_payment"));
            return false;
        }

        return true;
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) {
            return;
        }

        setCurrentStep((current) => {
            if (current === 0) {
                return 1;
            }

            if (current === 1) {
                return 2;
            }

            return 2;
        });
    };

    const handleSubmit = async () => {
        if (!validateStep(0) || !validateStep(1)) {
            return;
        }

        if (!tripId) {
            toast.error(t("page_missing_trip"));
            return;
        }

        setSubmitting(true);
        setDemoCompleted(false);

        try {
            const bookingResponse = await postApiBookings({
                body: {
                    tripId,
                    contactName: form.fullName.trim(),
                    contactPhone: form.phoneNumber.trim(),
                    contactEmail: form.email.trim(),
                    pickupStopId: form.pickupStopId,
                    dropoffStopId: form.dropoffStopId,
                    addressNote: form.addressNote.trim() || null,
                    paymentProvider: form.paymentProvider,
                },
            });

            if (bookingResponse.error || !bookingResponse.data?.bookingId) {
                throw bookingResponse.error ?? new Error(t("payment_submit_error"));
            }

            const bookingId = bookingResponse.data.bookingId;
            setDemoCompleted(true);

            if (form.paymentProvider === MOMO_PAYMENT_PROVIDER) {
                const momoResponse = await postApiPaymentsMomoCreate({
                    body: {
                        bookingId,
                    },
                });

                if (momoResponse.error || !momoResponse.data) {
                    throw momoResponse.error ?? new Error(t("payment_submit_error"));
                }

                const redirectUrl = getMomoRedirectUrl(momoResponse.data);

                if (redirectUrl) {
                    toast.success(t("payment_redirecting_momo"));
                    window.location.assign(redirectUrl);
                    return;
                }

                toast.success(t("payment_created_check_orders"));
                navigate("/orders");
                return;
            }

            toast.success(t("payment_cash_success"));
            navigate("/orders");
        } catch (submitError) {
            toast.error(parseApiErrorMessage(submitError, t("payment_submit_error")));
        } finally {
            setSubmitting(false);
        }
    };

    const renderStepContent = () => {
        if (currentStep === 0) {
            return (
                <Flex direction="column" gap="4">
                    <BookingAddressStep
                        form={form}
                        pickupOptions={pickupOptions}
                        dropoffOptions={dropoffOptions}
                        updateField={updateField}
                        title={t("address_title")}
                        description={t("address_desc")}
                        fullNameLabel={t("full_name_label")}
                        phoneLabel={t("phone_label")}
                        emailLabel={t("email_label")}
                        pickupLabel={t("pickup_label")}
                        dropoffLabel={t("dropoff_label")}
                        noteLabel={t("note_label")}
                        notePlaceholder={t("note_placeholder")}
                        stopNotAvailable={t("stop_not_available")}
                    />
                </Flex>
            );
        }

        if (currentStep === 1) {
            return (
                <Flex direction="column" gap="4">
                    <BookingPaymentStep
                        paymentOptions={paymentOptions}
                        paymentProvider={form.paymentProvider}
                        updateField={updateField}
                        title={t("payment_title")}
                        description={t("payment_desc")}
                        noteTitle={t("payment_note_title")}
                        noteDescription={t("payment_note_demo")}
                    />
                </Flex>
            );
        }

        return (
            <Flex direction="column" gap="4">
                <BookingConfirmStep
                    form={form}
                    selectedPickup={selectedPickup}
                    selectedDropoff={selectedDropoff}
                    selectedPayment={selectedPayment}
                    demoCompleted={demoCompleted}
                    title={t("confirm_title")}
                    description={t("confirm_desc")}
                    contactTitle={t("confirm_contact")}
                    routeTitle={t("confirm_route")}
                    addressNoteTitle={t("confirm_address_note")}
                    emptyNoteLabel={t("confirm_no_note")}
                    doneBadge={t("payment_done_badge")}
                    pendingBackendLabel={t("payment_success_title")}
                    doneDescription={t("payment_done_desc")}
                />
            </Flex>
        );
    };

    return (
        <Box className="bg-(--gray-2)" style={{ minHeight: "100%" }}>
            <Container size="4" px="4" py="6">
                <Flex direction="column" gap="5">
                    <Flex justify="between" align={{ initial: "start", sm: "center" }} gap="3" wrap="wrap">
                        <Box>
                            <Button variant="ghost" color="gray" size="2" onClick={() => navigate(-1)} className="mb-3">
                                <ArrowLeft size={16} />
                                {t("page_back_search")}
                            </Button>
                            <Heading size="7" mb="2">
                                {t("page_title")}
                            </Heading>
                            <Text size="3" color="gray">
                                {t("page_subtitle")}
                            </Text>
                        </Box>
                    </Flex>

                    {loading ? (
                        <Grid columns={{ initial: "1", lg: "3fr 1.2fr" }} gap="5">
                            <Flex direction="column" gap="4">
                                <Skeleton height="160px" />
                                <Skeleton height="420px" />
                            </Flex>
                            <Skeleton height="320px" />
                        </Grid>
                    ) : error || !trip ? (
                        <Card size="3">
                            <Flex direction="column" gap="3" align="center" py="7">
                                <Heading size="5">{t("page_error_title")}</Heading>
                                <Text size="2" color="gray" align="center">
                                    {error || t("page_fetch_error")}
                                </Text>
                                <Button onClick={() => navigate("/")}>{t("page_back_home")}</Button>
                            </Flex>
                        </Card>
                    ) : (
                        <Grid columns={{ initial: "1", lg: "3fr 1.2fr" }} gap="5" align="start">
                            <Flex direction="column" gap="5">
                                {!store.user.isAuthenticated ? (
                                    <BookingLoginPrompt
                                        title={t("page_login_required_title")}
                                        description={t("page_login_required_desc")}
                                        actionLabel={t("action_open_login")}
                                        onOpenLogin={() => setAuthDialogOpen(true)}
                                    />
                                ) : null}

                                <BookingTripCard
                                    title={t("trip_card_title")}
                                    companyName={trip.busCompanyName ?? "--"}
                                    routeLabel={routeLabel}
                                    priceLabel={formatCurrency(totalPrice)}
                                    departureTitle={t("trip_card_departure")}
                                    arrivalTitle={t("trip_card_arrival")}
                                    durationTitle={t("trip_card_duration")}
                                    availableLabel={t("trip_card_available", { count: trip.availableSeats ?? 0 })}
                                    departureTimeLabel={formatTimeLabel(trip.departureTime)}
                                    departureStopLabel={selectedPickup?.label || pickupOptions[0]?.label || "--"}
                                    arrivalTimeLabel={formatTimeLabel(trip.arrivalTime)}
                                    arrivalStopLabel={selectedDropoff?.label || dropoffOptions.at(-1)?.label || "--"}
                                    durationLabel={formatDurationLabel(trip.durationMinutes)}
                                />

                                <BookingStepper
                                    stepItems={stepItems}
                                    currentStep={currentStep}
                                    stepLabel={(value) => t("step_label", { value })}
                                />

                                <Card size="3" variant="surface">
                                    <Flex direction="column" gap="5">
                                        {renderStepContent()}

                                        <Flex justify="between" gap="3" wrap="wrap">
                                            <Button
                                                variant="soft"
                                                color="gray"
                                                disabled={submitting || currentStep === 0}
                                                onClick={() =>
                                                    setCurrentStep((current) => {
                                                        if (current === 2) {
                                                            return 1;
                                                        }

                                                        if (current === 1) {
                                                            return 0;
                                                        }

                                                        return 0;
                                                    })
                                                }
                                            >
                                                {t("action_back")}
                                            </Button>

                                            {currentStep < 2 ? (
                                                <Button color="blue" onClick={handleNext} disabled={submitting}>
                                                    {t("action_continue")}
                                                </Button>
                                            ) : (
                                                <Button
                                                    color="amber"
                                                    onClick={() => void handleSubmit()}
                                                    disabled={submitting}
                                                >
                                                    {submitting ? t("action_processing") : t("action_pay")}
                                                </Button>
                                            )}
                                        </Flex>
                                    </Flex>
                                </Card>
                            </Flex>

                            <BookingSummaryCard
                                title={t("summary_title")}
                                tripTitle={t("summary_trip")}
                                contactTitle={t("summary_contact")}
                                paymentTitle={t("summary_payment")}
                                totalTitle={t("summary_total")}
                                companyName={trip.busCompanyName ?? "--"}
                                departureDateTimeLabel={formatDateTimeLabel(trip.departureTime)}
                                routeLabel={routeLabel}
                                totalPriceLabel={formatCurrency(totalPrice)}
                                form={form}
                                selectedPickup={selectedPickup}
                                selectedDropoff={selectedDropoff}
                                selectedPayment={selectedPayment}
                            />
                        </Grid>
                    )}
                </Flex>
            </Container>

            <LoginDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </Box>
    );
});

export default PageMainBooking;
