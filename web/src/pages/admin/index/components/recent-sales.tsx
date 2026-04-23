import type { AdminDashboardRecentBookingDto } from "@/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

export function RecentSales({
    items,
    loading = false,
}: {
    items: AdminDashboardRecentBookingDto[];
    loading?: boolean;
}) {
    if (loading) {
        return (
            <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <Skeleton className="h-6 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Chưa có đơn đặt vé mới trong hệ thống.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {items.map((item) => (
                <div key={item.bookingId} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{getInitials(item.contactName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate text-sm leading-none font-medium">
                                    {item.contactName || "Khách hàng"}
                                </p>
                                <Badge variant="outline">{formatStatus(item.status)}</Badge>
                            </div>
                            <p className="truncate text-sm text-muted-foreground">
                                {item.contactEmail || "Không có email"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {item.routeName || "Chưa có tuyến"} • {item.ticketCount ?? 0} vé •{" "}
                                {formatDateTime(item.createdAt)}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="font-medium">{currencyFormatter.format(item.totalAmount ?? 0)}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getInitials(name?: string | null) {
    if (!name) {
        return "KH";
    }

    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "KH";
}

function formatStatus(status?: string | null) {
    switch (status) {
        case "Paid":
            return "Đã thanh toán";
        case "Pending":
            return "Chờ thanh toán";
        case "Cancelled":
            return "Đã hủy";
        case "Completed":
            return "Hoàn tất";
        default:
            return status || "Không xác định";
    }
}

function formatDateTime(value?: string) {
    if (!value) {
        return "--";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    }).format(new Date(value));
}
