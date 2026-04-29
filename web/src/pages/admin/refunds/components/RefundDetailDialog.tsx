import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type RefundDetailDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    refund: {
        refundRequestID: string;
        bookingID: string;
        requestedAmount: number;
        reason: string;
        status: number;
        requestedAt: string;
        contactName: string;
        contactEmail: string;
        contactPhone: string;
        tripRoute?: string | null;
        companyName?: string | null;
    } | null;
    onSuccess: () => void;
};

export function RefundDetailDialog({
    open,
    onOpenChange,
    refund,
}: RefundDetailDialogProps) {
    if (!refund) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chi tiết yêu cầu hoàn tiền</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Booking ID" value={refund.bookingID} />
                        <InfoRow
                            label="Số tiền"
                            value={new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            }).format(refund.requestedAmount)}
                        />
                        <InfoRow label="Người yêu cầu" value={refund.contactName} />
                        <InfoRow label="Email" value={refund.contactEmail} />
                        <InfoRow label="Số điện thoại" value={refund.contactPhone} />
                        <InfoRow label="Chuyến xe" value={refund.tripRoute || "N/A"} />
                        <InfoRow label="Nhà xe" value={refund.companyName || "N/A"} />
                        <InfoRow
                            label="Ngày yêu cầu"
                            value={new Date(refund.requestedAt).toLocaleString("vi-VN")}
                        />
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium">Lý do hoàn tiền:</div>
                        <div className="rounded-md border bg-muted p-3 text-sm">
                            {refund.reason}
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
            <div className="text-sm font-medium">{value}</div>
        </div>
    );
}
