import {
    getApiAdminBusAdminUpgradeRequests,
    patchApiAdminBusAdminUpgradeRequestsByRequestIdReview,
    type BusAdminUpgradeRequestStatus,
    type ReviewBusAdminUpgradeRequestDto,
} from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Clock3, RefreshCw, Search, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type UpgradeRequestItem = {
    id: string;
    companyId: string | null;
    companyName: string;
    licenseNumber: string | null;
    hotline: string | null;
    reason: string | null;
    status: BusAdminUpgradeRequestStatus;
    requestedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
    requesterName: string | null;
    requesterEmail: string | null;
    reviewedBy: {
        id: string | null;
        email: string | null;
        fullName: string | null;
    } | null;
    busCompany: {
        id: string | null;
        name: string | null;
        licenseNumber: string | null;
        hotline: string | null;
        isApproved: boolean;
    } | null;
};

type UpgradeRequestListResponse = {
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
    records?: unknown[];
};

type ReviewDialogState = {
    request: UpgradeRequestItem | null;
    note: string;
    mode: "approve" | "reject" | null;
};

const PAGE_SIZES = [25, 50, 100, 200] as const;
const STATUS_ALL = "all";
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: STATUS_ALL, label: "Tất cả" },
    { value: "0", label: "Chờ duyệt" },
    { value: "1", label: "Đã chấp thuận" },
    { value: "2", label: "Đã từ chối" },
];

export function PageAdminUpgradeRequests() {
    const [requests, setRequests] = useState<UpgradeRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>(STATUS_ALL);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({ request: null, note: "", mode: null });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const fetchRequests = useCallback(
        async (showRefreshing: boolean) => {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const query: { status?: BusAdminUpgradeRequestStatus; page?: number; pageSize?: number } = {
                    page,
                    pageSize,
                    ...(statusFilter === STATUS_ALL ? {} : { status: Number(statusFilter) as BusAdminUpgradeRequestStatus }),
                };

                const response = await getApiAdminBusAdminUpgradeRequests({ query });

                if (response.error || !response.data) {
                    throw new Error(getApiErrorMessage(response.error, "Không thể tải danh sách yêu cầu nâng cấp."));
                }

                const data = response.data as UpgradeRequestListResponse;
                setRequests(normalizeRequests(data.records));
                setTotalRecords(Number(data.totalRecords ?? 0));
                setTotalPages(Number(data.totalPages ?? 0));
                setError(null);
            } catch (e) {
                console.error("Không thể tải danh sách yêu cầu nâng cấp", e);
                setRequests([]);
                setTotalRecords(0);
                setTotalPages(0);
                setError(e instanceof Error ? e.message : "Không thể tải danh sách yêu cầu nâng cấp.");
                if (showRefreshing) {
                    toast.error("Làm mới danh sách yêu cầu nâng cấp thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, pageSize, statusFilter],
    );

    useEffect(() => {
        void fetchRequests(false);
    }, [fetchRequests]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, statusFilter, search]);

    const filteredRequests = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) {
            return requests;
        }

        return requests.filter((request) => {
            return [request.companyName, request.requesterName, request.requesterEmail, request.licenseNumber, request.hotline, request.reason]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(keyword));
        });
    }, [requests, search]);

    const counts = useMemo(
        () => ({
            pending: requests.filter((request) => request.status === 0).length,
            approved: requests.filter((request) => request.status === 1).length,
            rejected: requests.filter((request) => request.status === 2).length,
        }),
        [requests],
    );

    const canGoPrev = page > 1;
    const canGoNext = totalPages > 0 && page < totalPages;

    const openReviewDialog = (request: UpgradeRequestItem, mode: "approve" | "reject" | null = null) => {
        setReviewDialog({
            request,
            note: request.reviewNote ?? "",
            mode,
        });
    };

    const closeReviewDialog = () => {
        setReviewDialog({ request: null, note: "", mode: null });
    };

    const submitReview = async (approve: boolean) => {
        if (!reviewDialog.request) {
            return;
        }

        setReviewSubmitting(true);
        try {
            const payload: ReviewBusAdminUpgradeRequestDto = {
                approve,
                reviewNote: reviewDialog.note.trim() || null,
            };

            const response = await patchApiAdminBusAdminUpgradeRequestsByRequestIdReview({
                path: { requestId: reviewDialog.request.id },
                body: payload,
            });

            if (response.error) {
                throw new Error(getApiErrorMessage(response.error, approve ? "Không thể chấp thuận yêu cầu." : "Không thể từ chối yêu cầu."));
            }

            toast.success(approve ? "Đã chấp thuận yêu cầu nâng cấp" : "Đã từ chối yêu cầu nâng cấp");
            closeReviewDialog();
            await fetchRequests(true);
        } catch (e) {
            console.error("Không thể xử lý yêu cầu nâng cấp", e);
            toast.error(e instanceof Error ? e.message : "Không thể xử lý yêu cầu nâng cấp.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Yêu cầu nâng cấp BusAdmin</h1>
                        <Badge variant="outline">Trang {page} / {Math.max(totalPages, 1)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi danh sách request, trạng thái xử lý và duyệt trực tiếp trong dialog.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-72 max-w-full">
                        <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm công ty, người gửi, lý do..."
                            className="pl-8"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <select
                        value={pageSize}
                        onChange={(event) => setPageSize(Number(event.target.value))}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size} bản ghi
                            </option>
                        ))}
                    </select>

                    <Button variant="outline" onClick={() => void fetchRequests(true)} disabled={loading || refreshing}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                        Làm mới
                    </Button>
                </div>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-3">
                <SummaryCard title="Chờ duyệt" value={counts.pending} icon={<Clock3 className="h-4 w-4" />} loading={loading} />
                <SummaryCard title="Đã chấp thuận" value={counts.approved} icon={<ShieldCheck className="h-4 w-4" />} loading={loading} />
                <SummaryCard title="Đã từ chối" value={counts.rejected} icon={<ShieldAlert className="h-4 w-4" />} loading={loading} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách yêu cầu</CardTitle>
                    <CardDescription>
                        Hiển thị {filteredRequests.length} / {new Intl.NumberFormat("vi-VN").format(totalRecords)} bản ghi.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {error}
                        </div>
                    ) : null}

                    <div className="overflow-hidden rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Công ty</th>
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Người gửi</th>
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Trạng thái</th>
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Ngày gửi</th>
                                        <th className="h-11 px-3 text-right font-medium text-muted-foreground">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 6 }).map((_, index) => (
                                              <tr key={index} className="border-b">
                                                  {Array.from({ length: 5 }).map((__, cellIndex) => (
                                                      <td key={cellIndex} className="px-3 py-3">
                                                          <Skeleton className="h-6 w-full" />
                                                      </td>
                                                  ))}
                                              </tr>
                                          ))
                                        : null}

                                    {!loading && filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="h-24 px-3 text-center text-muted-foreground">
                                                Không có yêu cầu phù hợp.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!loading
                                        ? filteredRequests.map((request) => (
                                              <tr key={request.id} className="border-b align-top transition-colors hover:bg-muted/30">
                                                  <td className="px-3 py-3">
                                                      <div className="font-medium">{request.companyName}</div>
                                                      <div className="text-xs text-muted-foreground">
                                                          {request.licenseNumber || "Chưa có giấy phép"} · {request.hotline || "Chưa có hotline"}
                                                      </div>
                                                  </td>
                                                  <td className="px-3 py-3">
                                                      <div className="font-medium">{request.requesterName || "Không rõ"}</div>
                                                      <div className="text-xs text-muted-foreground">{request.requesterEmail || "Không có email"}</div>
                                                  </td>
                                                  <td className="px-3 py-3">
                                                      <StatusBadge status={request.status} />
                                                  </td>
                                                  <td className="px-3 py-3 text-muted-foreground">{formatDateTime(request.requestedAt)}</td>
                                                  <td className="px-3 py-3 text-right">
                                                      <div className="inline-flex gap-2">
                                                          <Button variant="outline" size="sm" onClick={() => openReviewDialog(request)}>
                                                              Xem
                                                          </Button>
                                                          <Button size="sm" onClick={() => openReviewDialog(request, "approve")}>
                                                              Duyệt
                                                          </Button>
                                                      </div>
                                                  </td>
                                              </tr>
                                          ))
                                        : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                            Hển thị {filteredRequests.length} / {new Intl.NumberFormat("vi-VN").format(totalRecords)} bản ghi
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={!canGoPrev}>
                                Trang trước
                            </Button>
                            <Badge variant="outline">Trang {page}</Badge>
                            <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!canGoNext}>
                                Trang sau
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={Boolean(reviewDialog.request)} onOpenChange={(open) => (!open ? closeReviewDialog() : null)}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{reviewDialog.request?.companyName || "Chi tiết yêu cầu"}</DialogTitle>
                        <DialogDescription>
                            Xem thông tin request và ghi chú review trước khi chấp thuận hoặc từ chối.
                        </DialogDescription>
                    </DialogHeader>

                    {reviewDialog.request ? (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Thông tin request</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                                    <InfoField label="Công ty" value={reviewDialog.request.companyName} />
                                    <InfoField label="Mã công ty" value={reviewDialog.request.companyId || "Chưa có"} />
                                    <InfoField label="Giấy phép" value={reviewDialog.request.licenseNumber || "Chưa có"} />
                                    <InfoField label="Hotline" value={reviewDialog.request.hotline || "Chưa có"} />
                                    <InfoField label="Người gửi" value={reviewDialog.request.requesterName || "Không rõ"} />
                                    <InfoField label="Email" value={reviewDialog.request.requesterEmail || "Không có"} />
                                    <InfoField label="Trạng thái" value={renderStatusText(reviewDialog.request.status)} />
                                    <InfoField label="Ngày gửi" value={formatDateTime(reviewDialog.request.requestedAt)} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Lý do</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        {reviewDialog.request.reason || "Không có lý do chi tiết."}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Ghi chú review</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={reviewDialog.note}
                                        onChange={(event) => setReviewDialog((current) => ({ ...current, note: event.target.value }))}
                                        placeholder="Nhập ghi chú nội bộ nếu cần..."
                                        rows={5}
                                    />
                                </CardContent>
                            </Card>

                            {reviewDialog.request.reviewedAt || reviewDialog.request.reviewedBy ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Lịch sử review</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                                        <InfoField label="Reviewed at" value={formatDateTime(reviewDialog.request.reviewedAt)} />
                                        <InfoField
                                            label="Reviewed by"
                                            value={reviewDialog.request.reviewedBy?.fullName || reviewDialog.request.reviewedBy?.email || "Chưa có"}
                                        />
                                        <InfoField
                                            label="Ghi chú"
                                            value={reviewDialog.request.reviewNote || "Chưa có ghi chú"}
                                        />
                                    </CardContent>
                                </Card>
                            ) : null}
                        </div>
                    ) : null}

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button variant="outline" onClick={closeReviewDialog} disabled={reviewSubmitting}>
                            Đóng
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                onClick={() => void submitReview(false)}
                                disabled={reviewSubmitting || reviewDialog.request?.status !== 0}
                            >
                                {reviewSubmitting && reviewDialog.mode === "reject" ? "Đang xử lý..." : "Từ chối"}
                            </Button>
                            <Button
                                onClick={() => void submitReview(true)}
                                disabled={reviewSubmitting || reviewDialog.request?.status !== 0}
                            >
                                {reviewSubmitting && reviewDialog.mode === "approve" ? "Đang xử lý..." : "Chấp thuận"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SummaryCard({ title, value, icon, loading }: { title: string; value: number; icon: React.ReactNode; loading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{formatNumber(value)}</div>}
            </CardContent>
        </Card>
    );
}

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span className="text-muted-foreground">{label}: </span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function StatusBadge({ status }: { status: BusAdminUpgradeRequestStatus }) {
    if (status === 0) {
        return <Badge variant="secondary">Chờ duyệt</Badge>;
    }

    if (status === 1) {
        return <Badge>Đã chấp thuận</Badge>;
    }

    return <Badge variant="destructive">Đã từ chối</Badge>;
}

function renderStatusText(status: BusAdminUpgradeRequestStatus): string {
    if (status === 0) {
        return "Chờ duyệt";
    }

    if (status === 1) {
        return "Đã chấp thuận";
    }

    return "Đã từ chối";
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return "Chưa có";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function normalizeRequests(records: unknown[] | undefined): UpgradeRequestItem[] {
    if (!Array.isArray(records)) {
        return [];
    }

    return records
        .map((item) => {
            if (!isObject(item)) {
                return null;
            }

            const id = pickString(item, ["requestID", "requestId", "id"]);
            const companyName = pickString(item, ["companyName"]);

            if (!id || !companyName) {
                return null;
            }

            const statusValue = pickStatus(item, ["status"]);

            return {
                id,
                companyId: pickString(item, ["companyID", "companyId"]),
                companyName,
                licenseNumber: pickString(item, ["licenseNumber"]),
                hotline: pickString(item, ["hotline"]),
                reason: pickString(item, ["reason"]),
                status: statusValue,
                requestedAt: pickString(item, ["requestedAt"]),
                reviewedAt: pickString(item, ["reviewedAt"]),
                reviewNote: pickString(item, ["reviewNote"]),
                requesterName: pickString(item, ["requesterName"]),
                requesterEmail: pickString(item, ["requesterEmail"]),
                reviewedBy: isObject(item.reviewedBy)
                    ? {
                          id: pickString(item.reviewedBy, ["userID", "userId", "id"]),
                          email: pickString(item.reviewedBy, ["email"]),
                          fullName: pickString(item.reviewedBy, ["fullName"]),
                      }
                    : null,
                busCompany: isObject(item.busCompany)
                    ? {
                          id: pickString(item.busCompany, ["companyID", "companyId", "id"]),
                          name: pickString(item.busCompany, ["name"]),
                          licenseNumber: pickString(item.busCompany, ["licenseNumber"]),
                          hotline: pickString(item.busCompany, ["hotline"]),
                          isApproved: pickBoolean(item.busCompany, ["isApproved"]),
                      }
                    : null,
            } satisfies UpgradeRequestItem;
        })
        .filter((item): item is UpgradeRequestItem => Boolean(item));
}

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return null;
}

function pickBoolean(source: Record<string, unknown>, keys: string[]): boolean {
    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "boolean") {
            return value;
        }
    }

    return false;
}

function pickStatus(source: Record<string, unknown>, keys: string[]): BusAdminUpgradeRequestStatus {
    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "number" && [0, 1, 2].includes(value)) {
            return value as BusAdminUpgradeRequestStatus;
        }
    }

    return 0;
}

function readDeepValue(source: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = source;

    for (const part of parts) {
        if (!isObject(current)) {
            return undefined;
        }

        current = current[part];
    }

    return current;
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("vi-VN").format(value);
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!error) {
        return fallback;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    if (typeof error === "object") {
        const maybeMessage =
            "message" in error && typeof error.message === "string"
                ? error.message
                : "error" in error && typeof error.error === "string"
                  ? error.error
                  : null;

        if (maybeMessage) {
            return maybeMessage;
        }
    }

    return fallback;
}
