import { getApiAdminSystemTransactionsByIntentId } from "@/api";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Local types (will be replaced by OpenAPI generated types after server restart)
type BookingStatus = 0 | 1 | 2 | 3;
type TicketStatus = 0 | 1 | 2;
type RefundStatus = 0 | 1;
type PaymentProvider = 0 | 1 | 2;
type PaymentIntentStatus = 0 | 1 | 2;

type TicketDetailDto = {
    ticketID: string;
    ticketCode: string;
    finalPrice: number;
    status: TicketStatus;
    passengerFullName?: string | null;
    passengerPhone?: string | null;
    passengerIdentityCard?: string | null;
    tripRouteName?: string | null;
    tripDepartureTime: string;
    tripDepartureLocation?: string | null;
    tripArrivalLocation?: string | null;
    seatName?: string | null;
};

type BookingDetailDto = {
    bookingID: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    totalAmount: number;
    status: BookingStatus;
    createdAt: string;
    expiresAt?: string | null;
    userID?: string | null;
    userEmail?: string | null;
    userFullName?: string | null;
    tickets: TicketDetailDto[];
};

type RefundDetailDto = {
    refundID: string;
    amount: number;
    reason?: string | null;
    status: RefundStatus;
    createdAt: string;
};

type TransactionDetailDto = {
    intentID: string;
    bookingID: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    createdAt: string;
    booking?: BookingDetailDto | null;
    refunds: RefundDetailDto[];
};

export function TransactionDetailDialog({
    intentId,
    open,
    onOpenChange,
}: {
    intentId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<TransactionDetailDto | null>(null);

    useEffect(() => {
        if (!open || !intentId) {
            setDetail(null);
            return;
        }

        const fetchDetail = async () => {
            setLoading(true);
            try {
                const response = await getApiAdminSystemTransactionsByIntentId({
                    path: { intentId },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải chi tiết giao dịch");
                }

                setDetail(response.data as unknown as TransactionDetailDto);
            } catch (e) {
                console.error("Failed to load transaction detail", e);
                toast.error(e instanceof Error ? e.message : "Không thể tải chi tiết giao dịch");
                onOpenChange(false);
            } finally {
                setLoading(false);
            }
        };

        void fetchDetail();
    }, [intentId, open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Chi tiết giao dịch</DialogTitle>
                    <DialogDescription>Thông tin đầy đủ về giao dịch và đơn đặt vé.</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : detail ? (
                    <div className="space-y-6">
                        {/* Payment Info */}
                        <Section title="Thông tin thanh toán">
                            <InfoRow label="Mã giao dịch" value={detail.intentID.slice(0, 13)} />
                            <InfoRow label="Phương thức" value={formatProvider(detail.provider)} />
                            <InfoRow label="Số tiền" value={formatCurrency(detail.amount)} />
                            <InfoRow
                                label="Trạng thái"
                                value={<Badge variant={getStatusBadgeVariant(detail.status)}>{formatStatus(detail.status)}</Badge>}
                            />
                            <InfoRow label="Ngày tạo" value={formatDateTime(detail.createdAt)} />
                        </Section>

                        {/* Booking Info */}
                        {detail.booking && (
                            <>
                                <Section title="Thông tin đặt vé">
                                    <InfoRow label="Mã đặt vé" value={detail.booking.bookingID.slice(0, 13)} />
                                    <InfoRow label="Người đặt" value={detail.booking.contactName || "N/A"} />
                                    <InfoRow label="Email" value={detail.booking.contactEmail || "N/A"} />
                                    <InfoRow label="Điện thoại" value={detail.booking.contactPhone || "N/A"} />
                                    {detail.booking.userEmail && (
                                        <InfoRow label="Tài khoản" value={`${detail.booking.userFullName} (${detail.booking.userEmail})`} />
                                    )}
                                    <InfoRow label="Tổng tiền" value={formatCurrency(detail.booking.totalAmount)} />
                                    <InfoRow
                                        label="Trạng thái booking"
                                        value={
                                            <Badge variant={getBookingStatusBadgeVariant(detail.booking.status)}>
                                                {formatBookingStatus(detail.booking.status)}
                                            </Badge>
                                        }
                                    />
                                    <InfoRow label="Ngày đặt" value={formatDateTime(detail.booking.createdAt)} />
                                    {detail.booking.expiresAt && (
                                        <InfoRow label="Hết hạn" value={formatDateTime(detail.booking.expiresAt)} />
                                    )}
                                </Section>

                                {/* Tickets */}
                                {detail.booking.tickets.length > 0 && (
                                    <Section title={`Danh sách vé (${detail.booking.tickets.length})`}>
                                        <div className="space-y-4">
                                            {detail.booking.tickets.map((ticket) => (
                                                <div key={ticket.ticketID} className="rounded-lg border p-4">
                                                    <div className="mb-2 flex items-start justify-between">
                                                        <div>
                                                            <div className="font-mono text-sm font-medium">{ticket.ticketCode}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {ticket.tripRouteName || "N/A"}
                                                            </div>
                                                        </div>
                                                        <Badge variant={getTicketStatusBadgeVariant(ticket.status)}>
                                                            {formatTicketStatus(ticket.status)}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid gap-2 text-sm">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-muted-foreground">Hành khách:</span>{" "}
                                                                {ticket.passengerFullName || "N/A"}
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">SĐT:</span>{" "}
                                                                {ticket.passengerPhone || "N/A"}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-muted-foreground">Ghế:</span>{" "}
                                                                {ticket.seatName || "N/A"}
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Giá vé:</span>{" "}
                                                                {formatCurrency(ticket.finalPrice)}
                                                            </div>
                                                        </div>
                                                        {ticket.tripDepartureTime && (
                                                            <div>
                                                                <span className="text-muted-foreground">Khởi hành:</span>{" "}
                                                                {formatDateTime(ticket.tripDepartureTime)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>
                                )}
                            </>
                        )}

                        {/* Refunds */}
                        {detail.refunds.length > 0 && (
                            <Section title={`Lịch sử hoàn tiền (${detail.refunds.length})`}>
                                <div className="space-y-3">
                                    {detail.refunds.map((refund) => (
                                        <div key={refund.refundID} className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                                            <div className="mb-1 flex items-center justify-between">
                                                <div className="font-medium">{formatCurrency(refund.amount)}</div>
                                                <Badge variant={getRefundStatusBadgeVariant(refund.status)}>
                                                    {formatRefundStatus(refund.status)}
                                                </Badge>
                                            </div>
                                            {refund.reason && (
                                                <div className="text-sm text-muted-foreground">Lý do: {refund.reason}</div>
                                            )}
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {formatDateTime(refund.createdAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">{title}</h3>
            <div className="space-y-2 text-sm">{children}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function formatProvider(provider: PaymentProvider): string {
    switch (provider) {
        case 0:
            return "Momo";
        case 1:
            return "Stripe";
        case 2:
            return "Tiền mặt";
        default:
            return String(provider);
    }
}

function formatStatus(status: PaymentIntentStatus): string {
    switch (status) {
        case 0:
            return "Đã tạo";
        case 1:
            return "Thành công";
        case 2:
            return "Thất bại";
        default:
            return String(status);
    }
}

function getStatusBadgeVariant(status: PaymentIntentStatus): "default" | "secondary" | "destructive" {
    switch (status) {
        case 0:
            return "secondary";
        case 1:
            return "default";
        case 2:
            return "destructive";
        default:
            return "secondary";
    }
}

function formatBookingStatus(status: BookingStatus): string {
    switch (status) {
        case 0:
            return "Chờ thanh toán";
        case 1:
            return "Đã thanh toán";
        case 2:
            return "Đã hủy";
        case 3:
            return "Đã hoàn tiền";
        default:
            return String(status);
    }
}

function getBookingStatusBadgeVariant(status: BookingStatus): "default" | "secondary" | "destructive" {
    switch (status) {
        case 0:
            return "secondary";
        case 1:
            return "default";
        case 2:
        case 3:
            return "destructive";
        default:
            return "secondary";
    }
}

function formatTicketStatus(status: TicketStatus): string {
    switch (status) {
        case 0:
            return "Đã xuất";
        case 1:
            return "Đã sử dụng";
        case 2:
            return "Đã hủy";
        default:
            return String(status);
    }
}

function getTicketStatusBadgeVariant(status: TicketStatus): "default" | "secondary" | "destructive" {
    switch (status) {
        case 0:
            return "default";
        case 1:
            return "secondary";
        case 2:
            return "destructive";
        default:
            return "secondary";
    }
}

function formatRefundStatus(status: RefundStatus): string {
    switch (status) {
        case 0:
            return "Đang xử lý";
        case 1:
            return "Đã hoàn tiền";
        default:
            return String(status);
    }
}

function getRefundStatusBadgeVariant(status: RefundStatus): "default" | "secondary" {
    switch (status) {
        case 0:
            return "secondary";
        case 1:
            return "default";
        default:
            return "secondary";
    }
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}
