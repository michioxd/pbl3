import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { useState } from "react";
import { toast } from "sonner";
import {
    postApiAdminSystemReviewsByReviewIdApprove,
    postApiAdminSystemReviewsByReviewIdReject,
    postApiAdminSystemReviewsByReviewIdFlag,
    postApiAdminSystemReviewsByReviewIdUnflag,
} from "@/api";

type ReviewDetailDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    review: {
        reviewID: string;
        ratingScore: number;
        comment: string | null;
        status: number;
        isFlagged: boolean;
        createdAt: string;
        moderatedAt: string | null;
        moderationReason: string | null;
        tripRoute: string;
        companyName: string;
        tripDepartureTime: string;
        tripArrivalTime: string;
        bookingContactName: string;
        bookingContactEmail: string;
        bookingContactPhone: string;
        moderatedByUserEmail: string | null;
    } | null;
    onSuccess: () => void;
};

const formatReviewStatus = (
    status: number
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    switch (status) {
        case 0:
            return { label: "Chờ duyệt", variant: "secondary" };
        case 1:
            return { label: "Đã duyệt", variant: "default" };
        case 2:
            return { label: "Đã từ chối", variant: "destructive" };
        case 3:
            return { label: "Đã gắn cờ", variant: "destructive" };
        default:
            return { label: "Không rõ", variant: "outline" };
    }
};

export function ReviewDetailDialog({
    open,
    onOpenChange,
    review,
    onSuccess,
}: ReviewDetailDialogProps) {
    const [moderationReason, setModerationReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    if (!review) return null;

    const statusInfo = formatReviewStatus(review.status);

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            const response = await postApiAdminSystemReviewsByReviewIdApprove({
                path: { reviewId: review.reviewID },
            });

            if (response.error) {
                toast.error("Lỗi khi duyệt đánh giá");
                return;
            }

            toast.success("Đã duyệt đánh giá");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Lỗi khi duyệt đánh giá");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!moderationReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await postApiAdminSystemReviewsByReviewIdReject({
                path: { reviewId: review.reviewID },
                body: { moderationReason },
            });

            if (response.error) {
                toast.error("Lỗi khi từ chối đánh giá");
                return;
            }

            toast.success("Đã từ chối đánh giá");
            setModerationReason("");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Lỗi khi từ chối đánh giá");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFlag = async () => {
        if (!moderationReason.trim()) {
            toast.error("Vui lòng nhập lý do gắn cờ");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await postApiAdminSystemReviewsByReviewIdFlag({
                path: { reviewId: review.reviewID },
                body: { moderationReason },
            });

            if (response.error) {
                toast.error("Lỗi khi gắn cờ đánh giá");
                return;
            }

            toast.success("Đã gắn cờ đánh giá");
            setModerationReason("");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Lỗi khi gắn cờ đánh giá");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnflag = async () => {
        setIsProcessing(true);
        try {
            const response = await postApiAdminSystemReviewsByReviewIdUnflag({
                path: { reviewId: review.reviewID },
            });

            if (response.error) {
                toast.error("Lỗi khi bỏ cờ đánh giá");
                return;
            }

            toast.success("Đã bỏ cờ đánh giá");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Lỗi khi bỏ cờ đánh giá");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Chi tiết đánh giá</DialogTitle>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Rating */}
                    <div>
                        <div className="mb-2 text-sm font-medium">Đánh giá:</div>
                        <StarRating rating={review.ratingScore} size="lg" />
                    </div>

                    {/* Comment */}
                    {review.comment && (
                        <div>
                            <div className="mb-2 text-sm font-medium">Nội dung đánh giá:</div>
                            <div className="rounded-md border bg-muted p-4 text-sm">
                                {review.comment}
                            </div>
                        </div>
                    )}

                    {/* Trip Info */}
                    <div>
                        <div className="mb-2 text-sm font-medium">Thông tin chuyến xe:</div>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="Tuyến đường" value={review.tripRoute} />
                            <InfoRow label="Nhà xe" value={review.companyName} />
                            <InfoRow
                                label="Giờ khởi hành"
                                value={new Date(review.tripDepartureTime).toLocaleString(
                                    "vi-VN"
                                )}
                            />
                            <InfoRow
                                label="Giờ đến"
                                value={new Date(review.tripArrivalTime).toLocaleString("vi-VN")}
                            />
                        </div>
                    </div>

                    {/* Reviewer Info */}
                    <div>
                        <div className="mb-2 text-sm font-medium">Người đánh giá:</div>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="Tên" value={review.bookingContactName} />
                            <InfoRow label="Email" value={review.bookingContactEmail} />
                            <InfoRow label="Số điện thoại" value={review.bookingContactPhone} />
                            <InfoRow
                                label="Ngày đánh giá"
                                value={new Date(review.createdAt).toLocaleString("vi-VN")}
                            />
                        </div>
                    </div>

                    {/* Moderation History */}
                    {review.moderatedAt && (
                        <div>
                            <div className="mb-2 text-sm font-medium">Lịch sử kiểm duyệt:</div>
                            <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                                <InfoRow
                                    label="Người kiểm duyệt"
                                    value={review.moderatedByUserEmail || "N/A"}
                                />
                                <InfoRow
                                    label="Thời gian"
                                    value={new Date(review.moderatedAt).toLocaleString("vi-VN")}
                                />
                                {review.moderationReason && (
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Lý do:
                                        </div>
                                        <div className="text-sm">{review.moderationReason}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions for Pending */}
                    {review.status === 0 && (
                        <div className="space-y-4 pt-4 border-t">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Lý do từ chối (nếu từ chối):
                                </label>
                                <Textarea
                                    placeholder="Nhập lý do từ chối..."
                                    value={moderationReason}
                                    onChange={(e) => setModerationReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                    className="flex-1"
                                >
                                    Duyệt
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    Từ chối
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Actions for Approved */}
                    {review.status === 1 && (
                        <div className="space-y-4 pt-4 border-t">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Lý do gắn cờ:
                                </label>
                                <Textarea
                                    placeholder="Nhập lý do gắn cờ..."
                                    value={moderationReason}
                                    onChange={(e) => setModerationReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <Button
                                onClick={handleFlag}
                                disabled={isProcessing}
                                variant="destructive"
                                className="w-full"
                            >
                                Gắn cờ
                            </Button>
                        </div>
                    )}

                    {/* Actions for Flagged */}
                    {review.status === 3 && (
                        <div className="pt-4 border-t">
                            <Button
                                onClick={handleUnflag}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                Bỏ cờ
                            </Button>
                        </div>
                    )}
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
