import { getApiPassengerTickets, postApiPassengerTicketsByTicketIdRefund, postApiReviews } from "@/api";
import { parseApiErrorMessage } from "@/pages/Main/booking/utils";
import {
    Blockquote,
    Container,
    Heading,
    Table,
    Badge,
    Flex,
    Text,
    Card,
    Spinner,
    Button,
    Dialog,
    Grid,
    Box,
    TextArea,
    Callout,
    Separator,
} from "@radix-ui/themes";
import { Star } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStore } from "@/stores";
import LoginDialog from "@/dialogs/Login";

type PassengerTicket = {
    ticketID?: string;
    ticketId?: string;
    bookingID?: string;
    bookingId?: string;
    tripID?: string;
    tripId?: string;
    ticketCode?: string;
    seatLabel?: string;
    seatFloor?: number;
    seatType?: unknown;
    price?: number;
    status?: unknown;
    routeName?: string;
    companyName?: string;
    distanceEstimate?: number;
    durationEstimate?: number;
    departureDate?: string;
    departureTime?: string;
    arrivalTime?: string;
    tripStatus?: unknown;
    cancellationPolicy?: string;
    tripNotes?: string;
    plateNumber?: string;
    busTypeName?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    bookingStatus?: unknown;
    bookingCreatedAt?: string;
    paymentStatus?: unknown;
    paymentProvider?: unknown;
    paidAt?: string;
    canRefund?: boolean;
    refundStatus?: unknown;
};

function getTicketStatusLabel(status: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
    switch (status) {
        case 0:
            return t("orders:status.pending_payment");
        case 1:
            return t("orders:status.confirmed");
        case 2:
            return t("orders:status.used");
        case 3:
            return t("orders:status.cancelled");
        default:
            return String(status ?? t("common:not_available"));
    }
}

function getTicketStatusColor(status: unknown): "gray" | "amber" | "green" | "red" {
    switch (status) {
        case 0:
            return "amber";
        case 1:
            return "green";
        case 3:
            return "red";
        default:
            return "gray";
    }
}

function getValue(value: unknown, t: (key: string) => string) {
    if (value === null || value === undefined || value === "") return t("common:not_available");
    return String(value);
}

function formatMoney(value: unknown, locale: string, t: (key: string) => string) {
    if (typeof value !== "number") return t("common:not_available");
    return new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(value);
}

function formatDateTime(value: unknown, locale: string, t: (key: string) => string) {
    if (!value) return t("common:not_available");
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getTicketId(ticket: PassengerTicket) {
    return ticket.ticketID || ticket.ticketId || "";
}

function getBookingId(ticket: PassengerTicket) {
    return ticket.bookingID || ticket.bookingId || "";
}

function getTripId(ticket: PassengerTicket) {
    return ticket.tripID || ticket.tripId || "";
}

function isAlreadyReviewedMessage(message: string) {
    return message.toLowerCase().includes("already reviewed");
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <Box>
            <Text as="div" size="1" color="gray" mb="1">
                {label}
            </Text>
            <Text as="div" size="2" weight="medium">
                {value}
            </Text>
        </Box>
    );
}

const PageManageOrders = observer(() => {
    const store = useStore();
    const { t, i18n } = useTranslation(["orders", "common"]);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const [data, setData] = useState<PassengerTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<PassengerTicket | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [refundError, setRefundError] = useState("");
    const [refundSuccess, setRefundSuccess] = useState("");
    const [isRefunding, setIsRefunding] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [submittedReviewBookingIds, setSubmittedReviewBookingIds] = useState<string[]>([]);
    const [duplicateReviewBookingIds, setDuplicateReviewBookingIds] = useState<string[]>([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const locale = i18n.resolvedLanguage?.toLowerCase().startsWith("en") ? "en-US" : "vi-VN";

    const fetchTickets = async () => {
        const res = await getApiPassengerTickets();
        const ticketsData = Array.isArray(res) ? res : (res as { data?: PassengerTicket[] })?.data || [];
        setData(ticketsData);
        return ticketsData;
    };

    useEffect(() => {
        if (!store.user.isAuthenticated && !store.user.isLoading) {
            setAuthDialogOpen(true);
            return;
        }

        if (store.user.isAuthenticated) {
            const loadTickets = async () => {
                try {
                    await fetchTickets();
                } catch {
                    setError(true);
                } finally {
                    setIsLoading(false);
                }
            };

            loadTickets();
        }
    }, [store.user.isAuthenticated, store.user.isLoading]);

    const handleOpenTicket = (ticket: PassengerTicket) => {
        setSelectedTicket(ticket);
        setRefundReason("");
        setRefundError("");
        setRefundSuccess("");
        setReviewRating(5);
        setReviewComment("");
        setReviewError("");
        setReviewSuccess("");
    };

    const handleRefund = async () => {
        if (!selectedTicket) return;

        const ticketId = getTicketId(selectedTicket);
        const bookingId = getBookingId(selectedTicket);
        const amount = selectedTicket.price;

        if (!ticketId || !bookingId || typeof amount !== "number") {
            setRefundError(t("orders:refund.missing_ticket_info"));
            return;
        }

        if (!refundReason.trim()) {
            setRefundError(t("orders:refund.reason_required"));
            return;
        }

        setIsRefunding(true);
        setRefundError("");
        setRefundSuccess("");

        try {
            const response = await postApiPassengerTicketsByTicketIdRefund({
                path: { ticketId },
                body: {
                    bookingID: bookingId,
                    amount,
                    reason: refundReason.trim(),
                },
            });

            if (response.error) {
                throw new Error(t("orders:refund.submit_failed"));
            }

            const refreshedTickets = await fetchTickets();
            setSelectedTicket(refreshedTickets.find((ticket) => getTicketId(ticket) === ticketId) || selectedTicket);
            setRefundSuccess(t("orders:refund.submit_success"));
            setRefundReason("");
        } catch (err) {
            setRefundError(err instanceof Error ? err.message : t("orders:refund.submit_failed"));
        } finally {
            setIsRefunding(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedTicket) return;

        const bookingId = getBookingId(selectedTicket);
        const tripId = getTripId(selectedTicket);

        if (!bookingId || !tripId) {
            setReviewError(t("orders:review.missing_trip_info"));
            return;
        }

        if (reviewRating < 1 || reviewRating > 5) {
            setReviewError(t("orders:review.rating_required"));
            return;
        }

        setIsSubmittingReview(true);
        setReviewError("");
        setReviewSuccess("");

        try {
            const response = await postApiReviews({
                body: {
                    bookingId,
                    tripId,
                    rating: reviewRating,
                    comment: reviewComment.trim() || undefined,
                },
            });

            if (response.error) {
                throw response.error;
            }

            const message = response.data?.message || t("orders:review.submit_success");

            setSubmittedReviewBookingIds((current) =>
                current.includes(bookingId) ? current : [...current, bookingId],
            );
            setReviewSuccess(message);
            setReviewComment("");
            toast.success(message);
        } catch (err) {
            const message = parseApiErrorMessage(err, t("orders:review.submit_failed"));

            if (isAlreadyReviewedMessage(message)) {
                setDuplicateReviewBookingIds((current) =>
                    current.includes(bookingId) ? current : [...current, bookingId],
                );
                setReviewError(t("orders:review.duplicate"));
                toast.error(t("orders:review.duplicate"));
                return;
            }

            setReviewError(message);
            toast.error(message);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (store.user.isLoading) {
        return (
            <Container size="4" px="4" py="8">
                <Flex justify="center" py="9">
                    <Spinner size="3" />
                </Flex>
            </Container>
        );
    }

    if (!store.user.isAuthenticated) {
        return (
            <Container size="2" px="4" py="8">
                <Card size="4">
                    <Flex direction="column" align="center" gap="4">
                        <Heading size="6">{t("orders:login_required_title")}</Heading>
                        <Text color="gray">{t("orders:login_required_desc")}</Text>
                        <Button onClick={() => setAuthDialogOpen(true)}>{t("orders:login_required_cta")}</Button>
                    </Flex>
                </Card>
                <LoginDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container size="4" px="4" py="8">
                <Flex justify="center" py="9">
                    <Spinner size="3" />
                </Flex>
            </Container>
        );
    }

    if (error) {
        return (
            <Container size="4" px="4" py="8">
                <Card style={{ backgroundColor: "var(--red-3)", borderColor: "var(--red-6)" }}>
                    <Text color="red">{t("orders:load_error")}</Text>
                </Card>
            </Container>
        );
    }

    const tickets = data;
    const selectedTicketId = selectedTicket ? getTicketId(selectedTicket) : "";
    const selectedBookingId = selectedTicket ? getBookingId(selectedTicket) : "";
    const selectedTripId = selectedTicket ? getTripId(selectedTicket) : "";
    const canReviewSelectedTicket = selectedTicket?.status === 2 && !!selectedBookingId && !!selectedTripId;
    const hasSubmittedReviewSelectedTicket =
        !!selectedBookingId && submittedReviewBookingIds.includes(selectedBookingId);
    const hasDuplicateReviewSelectedTicket =
        !!selectedBookingId && duplicateReviewBookingIds.includes(selectedBookingId);

    return (
        <Container size="4" px="4" py="8">
            <Heading size="6" mb="5">
                {t("orders:page_title")}
            </Heading>
            {tickets.length === 0 ? (
                <Text color="gray">{t("orders:empty")}</Text>
            ) : (
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>{t("orders:table.ticket_code")}</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>{t("orders:table.trip")}</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>{t("orders:table.seat_position")}</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>{t("orders:table.price")}</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>{t("orders:table.status")}</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>{t("orders:table.actions")}</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tickets.map((ticket, idx) => (
                            <Table.Row key={getTicketId(ticket) || ticket.ticketCode || idx}>
                                <Table.RowHeaderCell>
                                    {ticket.ticketCode || getTicketId(ticket) || t("common:not_available")}
                                </Table.RowHeaderCell>
                                <Table.Cell>{ticket.routeName || t("common:not_available")}</Table.Cell>
                                <Table.Cell>{ticket.seatLabel || t("common:not_available")}</Table.Cell>
                                <Table.Cell>{formatMoney(ticket.price, locale, (key) => t(key))}</Table.Cell>
                                <Table.Cell>
                                    <Badge color={getTicketStatusColor(ticket.status)}>
                                        {getTicketStatusLabel(ticket.status, t)}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Button size="1" variant="soft" onClick={() => handleOpenTicket(ticket)}>
                                        {t("orders:table.view_details")}
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}

            <Dialog.Root open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <Dialog.Content maxWidth="860px" style={{ maxHeight: "90vh", overflowY: "auto" }}>
                    <Dialog.Title>{t("orders:dialog.title")}</Dialog.Title>
                    <Dialog.Description size="2" color="gray">
                        {t("orders:dialog.description")}
                    </Dialog.Description>

                    {selectedTicket && (
                        <Flex direction="column" gap="5" mt="4">
                            <Card>
                                <Flex justify="between" align="start" gap="4" wrap="wrap">
                                    <Box>
                                        <Text as="div" size="1" color="gray">
                                            {t("orders:fields.ticket_code")}
                                        </Text>
                                        <Heading size="5">
                                            {selectedTicket.ticketCode || selectedTicketId || t("common:not_available")}
                                        </Heading>
                                    </Box>
                                    <Flex gap="2" align="center" wrap="wrap">
                                        <Badge color={getTicketStatusColor(selectedTicket.status)}>
                                            {getTicketStatusLabel(selectedTicket.status, t)}
                                        </Badge>
                                        {selectedTicket.refundStatus !== null &&
                                            selectedTicket.refundStatus !== undefined && (
                                                <Badge color="amber">
                                                    {t("orders:dialog.refund_badge", {
                                                        value: getValue(selectedTicket.refundStatus, (key) => t(key)),
                                                    })}
                                                </Badge>
                                            )}
                                    </Flex>
                                </Flex>
                            </Card>

                            <Box>
                                <Heading size="3" mb="3">
                                    {t("orders:sections.ticket_info")}
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
                                    <DetailItem
                                        label={t("orders:fields.seat")}
                                        value={getValue(selectedTicket.seatLabel, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.floor")}
                                        value={getValue(selectedTicket.seatFloor, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.seat_type")}
                                        value={getValue(selectedTicket.seatType, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:table.price")}
                                        value={formatMoney(selectedTicket.price, locale, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.booking_code")}
                                        value={getValue(selectedBookingId, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.booking_date")}
                                        value={formatDateTime(selectedTicket.bookingCreatedAt, locale, (key) => t(key))}
                                    />
                                </Grid>
                            </Box>

                            <Separator size="4" />

                            <Box>
                                <Heading size="3" mb="3">
                                    {t("orders:sections.trip_info")}
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
                                    <DetailItem
                                        label={t("orders:fields.route")}
                                        value={getValue(selectedTicket.routeName, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.company")}
                                        value={getValue(selectedTicket.companyName, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.departure_date")}
                                        value={getValue(selectedTicket.departureDate, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.departure_time")}
                                        value={getValue(selectedTicket.departureTime, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.arrival_time")}
                                        value={getValue(selectedTicket.arrivalTime, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.trip_status")}
                                        value={getValue(selectedTicket.tripStatus, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.distance")}
                                        value={
                                            selectedTicket.distanceEstimate
                                                ? t("orders:distance_value", { value: selectedTicket.distanceEstimate })
                                                : t("common:not_available")
                                        }
                                    />
                                    <DetailItem
                                        label={t("orders:fields.duration")}
                                        value={
                                            selectedTicket.durationEstimate
                                                ? t("orders:duration_value", { value: selectedTicket.durationEstimate })
                                                : t("common:not_available")
                                        }
                                    />
                                    <DetailItem
                                        label={t("orders:fields.note")}
                                        value={getValue(selectedTicket.tripNotes, (key) => t(key))}
                                    />
                                </Grid>
                            </Box>

                            <Separator size="4" />

                            <Box>
                                <Heading size="3" mb="3">
                                    {t("orders:sections.vehicle_contact")}
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
                                    <DetailItem
                                        label={t("orders:fields.plate_number")}
                                        value={getValue(selectedTicket.plateNumber, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.bus_type")}
                                        value={getValue(selectedTicket.busTypeName, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.contact_name")}
                                        value={getValue(selectedTicket.contactName, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.phone_number")}
                                        value={getValue(selectedTicket.contactPhone, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.email")}
                                        value={getValue(selectedTicket.contactEmail, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.cancellation_policy")}
                                        value={getValue(selectedTicket.cancellationPolicy, (key) => t(key))}
                                    />
                                </Grid>
                            </Box>

                            <Separator size="4" />

                            <Box>
                                <Heading size="3" mb="3">
                                    {t("orders:sections.payment_refund")}
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3" mb="4">
                                    <DetailItem
                                        label={t("orders:fields.booking_status")}
                                        value={getValue(selectedTicket.bookingStatus, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.payment_status")}
                                        value={getValue(selectedTicket.paymentStatus, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.payment_gateway")}
                                        value={getValue(selectedTicket.paymentProvider, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.paid_at")}
                                        value={formatDateTime(selectedTicket.paidAt, locale, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.refund_status")}
                                        value={getValue(selectedTicket.refundStatus, (key) => t(key))}
                                    />
                                    <DetailItem
                                        label={t("orders:fields.can_refund")}
                                        value={
                                            selectedTicket.canRefund ? t("orders:values.yes") : t("orders:values.no")
                                        }
                                    />
                                </Grid>

                                {refundSuccess && (
                                    <Callout.Root color="green" mb="3">
                                        <Callout.Text>{refundSuccess}</Callout.Text>
                                    </Callout.Root>
                                )}
                                {refundError && (
                                    <Callout.Root color="red" mb="3">
                                        <Callout.Text>{refundError}</Callout.Text>
                                    </Callout.Root>
                                )}

                                {selectedTicket.canRefund ? (
                                    <Flex direction="column" gap="3">
                                        <TextArea
                                            placeholder={t("orders:refund.reason_placeholder")}
                                            value={refundReason}
                                            onChange={(event) => setRefundReason(event.target.value)}
                                        />
                                        <Flex justify="end" gap="3">
                                            <Button variant="soft" color="gray" onClick={() => setSelectedTicket(null)}>
                                                {t("orders:refund.close")}
                                            </Button>
                                            <Button color="red" onClick={handleRefund} disabled={isRefunding}>
                                                {isRefunding
                                                    ? t("orders:refund.submitting")
                                                    : t("orders:refund.submit_request")}
                                            </Button>
                                        </Flex>
                                    </Flex>
                                ) : (
                                    <Flex justify="end">
                                        <Dialog.Close>
                                            <Button variant="soft" color="gray">
                                                {t("orders:refund.close")}
                                            </Button>
                                        </Dialog.Close>
                                    </Flex>
                                )}
                            </Box>

                            <Separator size="4" />

                            <Box>
                                <Heading size="3" mb="3">
                                    {t("orders:sections.trip_review")}
                                </Heading>

                                {canReviewSelectedTicket && !hasDuplicateReviewSelectedTicket ? (
                                    <Flex direction="column" gap="3">
                                        <Text size="2" color="gray">
                                            {t("orders:review.description")}
                                        </Text>

                                        <Flex direction="column" gap="2">
                                            <Text size="2" weight="medium">
                                                {t("orders:review.rating_label")}
                                            </Text>
                                            <Flex gap="2">
                                                {Array.from({ length: 5 }, (_, index) => {
                                                    const value = index + 1;
                                                    const active = value <= reviewRating;

                                                    return (
                                                        <Button
                                                            key={value}
                                                            type="button"
                                                            variant="ghost"
                                                            color={active ? "amber" : "gray"}
                                                            onClick={() => setReviewRating(value)}
                                                            disabled={hasSubmittedReviewSelectedTicket}
                                                            style={{ padding: 4 }}
                                                        >
                                                            <Star
                                                                size={20}
                                                                style={{
                                                                    color: active ? "#f59e0b" : "#9ca3af",
                                                                    fill: active ? "#f59e0b" : "transparent",
                                                                }}
                                                            />
                                                        </Button>
                                                    );
                                                })}
                                            </Flex>
                                        </Flex>

                                        <Flex direction="column" gap="2">
                                            <Text size="2" weight="medium">
                                                {t("orders:review.comment_label")}
                                            </Text>
                                            <TextArea
                                                placeholder={t("orders:review.comment_placeholder")}
                                                value={reviewComment}
                                                disabled={hasSubmittedReviewSelectedTicket}
                                                onChange={(event) => setReviewComment(event.target.value)}
                                            />
                                        </Flex>

                                        {reviewSuccess && (
                                            <Callout.Root color="green">
                                                <Callout.Text>{reviewSuccess}</Callout.Text>
                                            </Callout.Root>
                                        )}

                                        {reviewError && (
                                            <Callout.Root color="red">
                                                <Callout.Text>{reviewError}</Callout.Text>
                                            </Callout.Root>
                                        )}

                                        <Blockquote color="gray">{t("orders:review.moderation_note")}</Blockquote>

                                        <Flex justify="end">
                                            <Button
                                                onClick={handleSubmitReview}
                                                disabled={isSubmittingReview || hasSubmittedReviewSelectedTicket}
                                            >
                                                {hasSubmittedReviewSelectedTicket
                                                    ? t("orders:review.submitted")
                                                    : isSubmittingReview
                                                      ? t("orders:review.submitting")
                                                      : t("orders:review.submit")}
                                            </Button>
                                        </Flex>
                                    </Flex>
                                ) : hasDuplicateReviewSelectedTicket ? (
                                    <Callout.Root color="amber">
                                        <Callout.Text>{t("orders:review.duplicate")}</Callout.Text>
                                    </Callout.Root>
                                ) : (
                                    <Text size="2" color="gray">
                                        {t("orders:review.used_only")}
                                    </Text>
                                )}
                            </Box>
                        </Flex>
                    )}
                </Dialog.Content>
            </Dialog.Root>
        </Container>
    );
});

export default PageManageOrders;
