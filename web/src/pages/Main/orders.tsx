import { getApiPassengerTickets, postApiPassengerTicketsByTicketIdRefund } from "@/api";
import {
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
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
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

function getTicketStatusLabel(status: unknown) {
    switch (status) {
        case 0:
            return "Chờ thanh toán";
        case 1:
            return "Đã xác nhận";
        case 2:
            return "Đã sử dụng";
        case 3:
            return "Đã hủy";
        default:
            return String(status ?? "N/A");
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

function getValue(value: unknown) {
    if (value === null || value === undefined || value === "") return "N/A";
    return String(value);
}

function formatMoney(value: unknown) {
    if (typeof value !== "number") return "N/A";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDateTime(value: unknown) {
    if (!value) return "N/A";
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getTicketId(ticket: PassengerTicket) {
    return ticket.ticketID || ticket.ticketId || "";
}

function getBookingId(ticket: PassengerTicket) {
    return ticket.bookingID || ticket.bookingId || "";
}

function DetailItem({ label, value }: { label: string; value: unknown }) {
    return (
        <Box>
            <Text as="div" size="1" color="gray" mb="1">
                {label}
            </Text>
            <Text as="div" size="2" weight="medium">
                {getValue(value)}
            </Text>
        </Box>
    );
}

const PageManageOrders = observer(() => {
    const store = useStore();
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const [data, setData] = useState<PassengerTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<PassengerTicket | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [refundError, setRefundError] = useState("");
    const [refundSuccess, setRefundSuccess] = useState("");
    const [isRefunding, setIsRefunding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

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
    };

    const handleRefund = async () => {
        if (!selectedTicket) return;

        const ticketId = getTicketId(selectedTicket);
        const bookingId = getBookingId(selectedTicket);
        const amount = selectedTicket.price;

        if (!ticketId || !bookingId || typeof amount !== "number") {
            setRefundError("Thiếu thông tin vé để tạo yêu cầu hoàn tiền.");
            return;
        }

        if (!refundReason.trim()) {
            setRefundError("Vui lòng nhập lý do hoàn tiền.");
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
                throw new Error("Không thể gửi yêu cầu hoàn tiền.");
            }

            const refreshedTickets = await fetchTickets();
            setSelectedTicket(refreshedTickets.find((ticket) => getTicketId(ticket) === ticketId) || selectedTicket);
            setRefundSuccess("Đã gửi yêu cầu hoàn tiền. Vui lòng chờ quản trị viên xử lý.");
            setRefundReason("");
        } catch (err) {
            setRefundError(err instanceof Error ? err.message : "Không thể gửi yêu cầu hoàn tiền.");
        } finally {
            setIsRefunding(false);
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
                        <Heading size="6">Yêu cầu đăng nhập</Heading>
                        <Text color="gray">Vui lòng đăng nhập để xem đơn hàng của bạn.</Text>
                        <Button onClick={() => setAuthDialogOpen(true)}>Đăng nhập ngay</Button>
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
                    <Text color="red">Đã xảy ra lỗi khi tải danh sách đơn hàng.</Text>
                </Card>
            </Container>
        );
    }

    const tickets = data;
    const selectedTicketId = selectedTicket ? getTicketId(selectedTicket) : "";
    const selectedBookingId = selectedTicket ? getBookingId(selectedTicket) : "";

    return (
        <Container size="4" px="4" py="8">
            <Heading size="6" mb="5">
                Quản lý đơn hàng
            </Heading>
            {tickets.length === 0 ? (
                <Text color="gray">Bạn chưa có đơn hàng nào.</Text>
            ) : (
                <Table.Root variant="surface">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>Mã vé</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Chuyến xe</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Vị trí ghế</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Giá vé</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Trạng thái</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Thao tác</Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tickets.map((ticket, idx) => (
                            <Table.Row key={getTicketId(ticket) || ticket.ticketCode || idx}>
                                <Table.RowHeaderCell>
                                    {ticket.ticketCode || getTicketId(ticket) || "N/A"}
                                </Table.RowHeaderCell>
                                <Table.Cell>{ticket.routeName || "N/A"}</Table.Cell>
                                <Table.Cell>{ticket.seatLabel || "N/A"}</Table.Cell>
                                <Table.Cell>{formatMoney(ticket.price)}</Table.Cell>
                                <Table.Cell>
                                    <Badge color={getTicketStatusColor(ticket.status)}>
                                        {getTicketStatusLabel(ticket.status)}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Button size="1" variant="soft" onClick={() => handleOpenTicket(ticket)}>
                                        Xem chi tiết
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            )}

            <Dialog.Root open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <Dialog.Content maxWidth="860px" style={{ maxHeight: "90vh", overflowY: "auto" }}>
                    <Dialog.Title>Chi tiết vé</Dialog.Title>
                    <Dialog.Description size="2" color="gray">
                        Thông tin vé, chuyến đi, thanh toán và yêu cầu hoàn tiền.
                    </Dialog.Description>

                    {selectedTicket && (
                        <Flex direction="column" gap="5" mt="4">
                            <Card>
                                <Flex justify="between" align="start" gap="4" wrap="wrap">
                                    <Box>
                                        <Text as="div" size="1" color="gray">
                                            Mã vé
                                        </Text>
                                        <Heading size="5">
                                            {selectedTicket.ticketCode || selectedTicketId || "N/A"}
                                        </Heading>
                                    </Box>
                                    <Flex gap="2" align="center" wrap="wrap">
                                        <Badge color={getTicketStatusColor(selectedTicket.status)}>
                                            {getTicketStatusLabel(selectedTicket.status)}
                                        </Badge>
                                        {selectedTicket.refundStatus !== null &&
                                            selectedTicket.refundStatus !== undefined && (
                                                <Badge color="amber">
                                                    Hoàn tiền: {getValue(selectedTicket.refundStatus)}
                                                </Badge>
                                            )}
                                    </Flex>
                                </Flex>
                            </Card>

                            <Box>
                                <Heading size="3" mb="3">
                                    Thông tin vé
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
                                    <DetailItem label="Ghế" value={selectedTicket.seatLabel} />
                                    <DetailItem label="Tầng" value={selectedTicket.seatFloor} />
                                    <DetailItem label="Loại ghế" value={selectedTicket.seatType} />
                                    <DetailItem label="Giá vé" value={formatMoney(selectedTicket.price)} />
                                    <DetailItem label="Mã booking" value={selectedBookingId} />
                                    <DetailItem
                                        label="Ngày đặt"
                                        value={formatDateTime(selectedTicket.bookingCreatedAt)}
                                    />
                                </Grid>
                            </Box>

                            <Separator size="4" />

                            <Box>
                                <Heading size="3" mb="3">
                                    Chuyến đi
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
                                    <DetailItem label="Tuyến" value={selectedTicket.routeName} />
                                    <DetailItem label="Nhà xe" value={selectedTicket.companyName} />
                                    <DetailItem label="Ngày khởi hành" value={selectedTicket.departureDate} />
                                    <DetailItem label="Giờ đi" value={selectedTicket.departureTime} />
                                    <DetailItem label="Giờ đến" value={selectedTicket.arrivalTime} />
                                    <DetailItem label="Trạng thái chuyến" value={selectedTicket.tripStatus} />
                                    <DetailItem
                                        label="Khoảng cách"
                                        value={
                                            selectedTicket.distanceEstimate
                                                ? `${selectedTicket.distanceEstimate} km`
                                                : "N/A"
                                        }
                                    />
                                    <DetailItem
                                        label="Thời lượng"
                                        value={
                                            selectedTicket.durationEstimate
                                                ? `${selectedTicket.durationEstimate} phút`
                                                : "N/A"
                                        }
                                    />
                                    <DetailItem label="Ghi chú" value={selectedTicket.tripNotes} />
                                </Grid>
                            </Box>

                            <Separator size="4" />

                            <Box>
                                <Heading size="3" mb="3">
                                    Xe và liên hệ
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
                                    <DetailItem label="Biển số" value={selectedTicket.plateNumber} />
                                    <DetailItem label="Loại xe" value={selectedTicket.busTypeName} />
                                    <DetailItem label="Người liên hệ" value={selectedTicket.contactName} />
                                    <DetailItem label="Số điện thoại" value={selectedTicket.contactPhone} />
                                    <DetailItem label="Email" value={selectedTicket.contactEmail} />
                                    <DetailItem label="Chính sách hủy" value={selectedTicket.cancellationPolicy} />
                                </Grid>
                            </Box>

                            <Separator size="4" />

                            <Box>
                                <Heading size="3" mb="3">
                                    Thanh toán và hoàn tiền
                                </Heading>
                                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3" mb="4">
                                    <DetailItem label="Trạng thái booking" value={selectedTicket.bookingStatus} />
                                    <DetailItem label="Trạng thái thanh toán" value={selectedTicket.paymentStatus} />
                                    <DetailItem label="Cổng thanh toán" value={selectedTicket.paymentProvider} />
                                    <DetailItem
                                        label="Đã thanh toán lúc"
                                        value={formatDateTime(selectedTicket.paidAt)}
                                    />
                                    <DetailItem label="Trạng thái hoàn tiền" value={selectedTicket.refundStatus} />
                                    <DetailItem
                                        label="Có thể hoàn tiền"
                                        value={selectedTicket.canRefund ? "Có" : "Không"}
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
                                            placeholder="Nhập lý do hoàn tiền..."
                                            value={refundReason}
                                            onChange={(event) => setRefundReason(event.target.value)}
                                        />
                                        <Flex justify="end" gap="3">
                                            <Button variant="soft" color="gray" onClick={() => setSelectedTicket(null)}>
                                                Đóng
                                            </Button>
                                            <Button color="red" onClick={handleRefund} disabled={isRefunding}>
                                                {isRefunding ? "Đang gửi..." : "Yêu cầu hoàn tiền"}
                                            </Button>
                                        </Flex>
                                    </Flex>
                                ) : (
                                    <Flex justify="end">
                                        <Dialog.Close>
                                            <Button variant="soft" color="gray">
                                                Đóng
                                            </Button>
                                        </Dialog.Close>
                                    </Flex>
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
