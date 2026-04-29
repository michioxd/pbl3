import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type TripDetailDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trip: {
        tripID: string;
        routeName: string;
        companyName: string;
        busPlateNumber: string | null;
        departureTime: string;
        arrivalTime: string;
        status: number;
        totalSeats: number;
        bookedSeats: number;
        revenue: number;
    } | null;
};

const formatTripStatus = (status: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    switch (status) {
        case 0:
            return { label: "Đã lên lịch", variant: "secondary" };
        case 1:
            return { label: "Đang chạy", variant: "default" };
        case 2:
            return { label: "Hoàn thành", variant: "outline" };
        case 3:
            return { label: "Đã hủy", variant: "destructive" };
        default:
            return { label: "Không rõ", variant: "outline" };
    }
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export function TripDetailDialog({
    open,
    onOpenChange,
    trip,
}: TripDetailDialogProps) {
    if (!trip) return null;

    const statusInfo = formatTripStatus(trip.status);
    const occupancy = (trip.bookedSeats / trip.totalSeats) * 100;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chi tiết chuyến xe</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">{trip.routeName}</h3>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{trip.companyName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InfoRow
                            label="Biển số xe"
                            value={trip.busPlateNumber || "Chưa phân"}
                        />
                        <InfoRow label="Trip ID" value={trip.tripID} />
                        <InfoRow
                            label="Giờ khởi hành"
                            value={formatDateTime(trip.departureTime)}
                        />
                        <InfoRow
                            label="Giờ đến"
                            value={formatDateTime(trip.arrivalTime)}
                        />
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium">Tình trạng chỗ ngồi:</div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>
                                    {trip.bookedSeats} / {trip.totalSeats} chỗ
                                </span>
                                <span className="font-medium">{occupancy.toFixed(1)}%</span>
                            </div>
                            <Progress value={occupancy} className="h-3" />
                        </div>
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-muted-foreground">Doanh thu</div>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(trip.revenue)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Số vé đã bán</div>
                                <div className="text-2xl font-bold">{trip.bookedSeats}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-medium break-all">{value}</div>
        </div>
    );
}
