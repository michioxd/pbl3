import {
    getApiAdminSystemUpgradeRequests,
    patchApiAdminSystemUpgradeRequestsByRequestIdReview,
} from "@/api";
import {
    DataTableColumnHeader,
    DataTablePagination,
    DataTableToolbar,
} from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type FilterFn,
    type PaginationState,
    type SortingState,
} from "@tanstack/react-table";
import {
    CheckCircle,
    Clock,
    Package,
    RefreshCw,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Local type definitions until OpenAPI regeneration (requires backend server running)
// Backend uses enum: 0=Pending, 1=Approved, 2=Rejected
type BusAdminUpgradeRequestStatus = 0 | 1 | 2;

type BusCompanyBasicDto = {
    companyID: string;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    isApproved: boolean;
};

type UserBasicDto = {
    userID: string;
    email: string;
    fullName?: string | null;
};

type BusAdminUpgradeRequestListItemDto = {
    requestID: string;
    requesterUserID: string;
    requesterEmail?: string | null;
    requesterName?: string | null;
    companyName: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    reason?: string | null;
    status: BusAdminUpgradeRequestStatus;
    requestedAt: string;
    reviewedAt?: string | null;
    reviewNote?: string | null;
    companyID?: string | null;
    busCompany?: BusCompanyBasicDto | null;
    reviewedBy?: UserBasicDto | null;
};

type BusAdminUpgradeRequestListResponseDto = {
    records: BusAdminUpgradeRequestListItemDto[];
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
};

// Status enum constants
const STATUS_PENDING = 0 as BusAdminUpgradeRequestStatus;
const STATUS_APPROVED = 1 as BusAdminUpgradeRequestStatus;
const STATUS_REJECTED = 2 as BusAdminUpgradeRequestStatus;

type ReviewFormState = {
    reviewNote: string;
};

const emptyReviewForm: ReviewFormState = {
    reviewNote: "",
};

const statusFilterOptions = [
    { label: "Chờ xét duyệt", value: "0" },
    { label: "Đã chấp thuận", value: "1" },
    { label: "Đã từ chối", value: "2" },
];

const statusFilterFn: FilterFn<BusAdminUpgradeRequestListItemDto> = (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
    }

    const rowStatus = String(row.getValue(columnId));
    return filterValue.includes(rowStatus);
};

export function PageAdminUpgradeRequests() {
    const [requests, setRequests] = useState<BusAdminUpgradeRequestListItemDto[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [reviewingRequest, setReviewingRequest] = useState<BusAdminUpgradeRequestListItemDto | null>(null);
    const [reviewForm, setReviewForm] = useState<ReviewFormState>(emptyReviewForm);
    const [sorting, setSorting] = useState<SortingState>([{ id: "ngayYeuCau", desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
    const hasLoadedOnceRef = useRef(false);

    const statusFilterValues = useMemo(() => {
        const value = columnFilters.find((filter) => filter.id === "trangThai")?.value;
        return Array.isArray(value) ? value.map(String) : [];
    }, [columnFilters]);

    const statusFilterKey = statusFilterValues.join("|");

    useEffect(() => {
        setPagination((current) => {
            if (current.pageIndex === 0) {
                return current;
            }

            return {
                ...current,
                pageIndex: 0,
            };
        });
    }, [statusFilterKey]);

    const requestData = useCallback(async () => {
        const statusParam: BusAdminUpgradeRequestStatus | undefined =
            statusFilterValues.length === 1 ? (Number(statusFilterValues[0]) as BusAdminUpgradeRequestStatus) : undefined;

        const response = await getApiAdminSystemUpgradeRequests({
            query: {
                ...(statusParam !== undefined ? { status: statusParam } : {}),
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
            },
        });

        if (response.error || !response.data) {
            throw new Error(getApiErrorMessage(response.error, "Không thể tải danh sách yêu cầu."));
        }

        return response.data as unknown as BusAdminUpgradeRequestListResponseDto;
    }, [pagination.pageIndex, pagination.pageSize, statusFilterValues]);

    const fetchRequests = useCallback(
        async (showRefreshing = hasLoadedOnceRef.current) => {
            if (!showRefreshing) {
                setLoading(true);
            }

            if (showRefreshing) {
                setRefreshing(true);
            }

            try {
                const data = await requestData();
                setRequests(data.records ?? []);
                setTotalRecords(data.totalRecords ?? 0);
                setTotalPages(Math.max(data.totalPages ?? 1, 1));
                setError(null);

                if (data.pageSize && data.pageSize !== pagination.pageSize) {
                    setPagination((current) => ({ ...current, pageSize: data.pageSize }));
                }

                if (typeof data.page === "number" && data.page - 1 !== pagination.pageIndex) {
                    setPagination((current) => ({ ...current, pageIndex: Math.max(data.page - 1, 0) }));
                }

                hasLoadedOnceRef.current = true;
            } catch (e) {
                console.error("Không thể tải danh sách yêu cầu", e);
                setRequests([]);
                setTotalRecords(0);
                setTotalPages(1);
                setError(e instanceof Error ? e.message : "Không thể tải danh sách yêu cầu.");

                if (showRefreshing) {
                    toast.error("Làm mới danh sách yêu cầu thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [pagination.pageIndex, pagination.pageSize, requestData],
    );

    useEffect(() => {
        void fetchRequests();
    }, [fetchRequests]);

    const openReviewDialog = (request: BusAdminUpgradeRequestListItemDto) => {
        setReviewingRequest(request);
        setReviewForm(emptyReviewForm);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setReviewingRequest(null);
        setReviewForm(emptyReviewForm);
    };

    const handleReview = async (approve: boolean) => {
        if (!reviewingRequest) return;

        setSubmitting(true);
        try {
            const response = await patchApiAdminSystemUpgradeRequestsByRequestIdReview({
                path: { requestId: reviewingRequest.requestID },
                body: {
                    approve,
                    reviewNote: reviewForm.reviewNote.trim() || null,
                },
            });

            if (response.error) {
                throw new Error(getApiErrorMessage(response.error, "Không thể xét duyệt yêu cầu"));
            }

            toast.success(approve ? "Đã chấp thuận yêu cầu" : "Đã từ chối yêu cầu");
            closeDialog();
            await fetchRequests(true);
        } catch (e) {
            console.error("Review failed", e);
            toast.error(e instanceof Error ? e.message : "Không thể xét duyệt yêu cầu");
        } finally {
            setSubmitting(false);
        }
    };

    const columns = useMemo<ColumnDef<BusAdminUpgradeRequestListItemDto>[]>(
        () => [
            {
                id: "nguoiYeuCau",
                accessorFn: (row) => `${row.requesterName ?? ""} ${row.requesterEmail ?? ""}`.toLowerCase(),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Người yêu cầu" />,
                cell: ({ row }) => (
                    <div className="space-y-1">
                        <div className="font-medium">{row.original.requesterName || "Chưa có tên"}</div>
                        <div className="text-sm text-muted-foreground">{row.original.requesterEmail}</div>
                    </div>
                ),
            },
            {
                id: "congTy",
                accessorFn: (row) => row.companyName.toLowerCase(),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Công ty" />,
                cell: ({ row }) => (
                    <div className="space-y-1">
                        <div className="font-medium">{row.original.companyName}</div>
                        {row.original.licenseNumber && (
                            <div className="text-xs text-muted-foreground">GP: {row.original.licenseNumber}</div>
                        )}
                        {row.original.hotline && (
                            <div className="text-xs text-muted-foreground">Hotline: {row.original.hotline}</div>
                        )}
                    </div>
                ),
            },
            {
                id: "trangThai",
                accessorFn: (row) => row.status,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
                cell: ({ row }) => (
                    <Badge variant={getStatusBadgeVariant(row.original.status)}>
                        {formatStatus(row.original.status)}
                    </Badge>
                ),
                filterFn: statusFilterFn,
            },
            {
                id: "ngayYeuCau",
                accessorFn: (row) => new Date(row.requestedAt).getTime(),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày yêu cầu" />,
                cell: ({ row }) => <div className="text-muted-foreground">{formatDateTime(row.original.requestedAt)}</div>,
            },
            {
                id: "ngayXetDuyet",
                accessorFn: (row) => (row.reviewedAt ? new Date(row.reviewedAt).getTime() : 0),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày xét duyệt" />,
                cell: ({ row }) =>
                    row.original.reviewedAt ? (
                        <div className="text-muted-foreground">{formatDateTime(row.original.reviewedAt)}</div>
                    ) : (
                        <div className="text-xs text-muted-foreground">Chưa xét duyệt</div>
                    ),
            },
            {
                id: "nguoiXetDuyet",
                accessorFn: (row) => row.reviewedBy?.fullName ?? "",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Người xét duyệt" />,
                cell: ({ row }) =>
                    row.original.reviewedBy ? (
                        <div className="space-y-1">
                            <div className="font-medium">{row.original.reviewedBy.fullName || "Chưa có tên"}</div>
                            <div className="text-xs text-muted-foreground">{row.original.reviewedBy.email}</div>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground">—</div>
                    ),
            },
            {
                id: "thaoTac",
                header: () => <div className="text-right">Thao tác</div>,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <Button
                            variant={row.original.status === STATUS_PENDING ? "default" : "outline"}
                            size="sm"
                            onClick={() => openReviewDialog(row.original)}
                            disabled={row.original.status !== STATUS_PENDING}
                        >
                            {row.original.status === STATUS_PENDING ? "Xem & Xét duyệt" : "Xem chi tiết"}
                        </Button>
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [],
    );

    const table = useReactTable({
        data: requests,
        columns,
        state: {
            sorting,
            columnFilters,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const pendingCount = requests.filter((r) => r.status === STATUS_PENDING).length;
    const approvedCount = requests.filter((r) => r.status === STATUS_APPROVED).length;
    const rejectedCount = requests.filter((r) => r.status === STATUS_REJECTED).length;

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Yêu cầu nâng cấp BusAdmin</h1>
                        <Badge variant="outline">{totalRecords} yêu cầu</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Xét duyệt yêu cầu nâng cấp tài khoản từ Hành khách lên Quản trị nhà xe.
                    </p>
                </div>

                <Button variant="outline" onClick={() => void fetchRequests(true)} disabled={loading || refreshing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Tổng yêu cầu"
                    value={totalRecords}
                    icon={<Package className="h-4 w-4" />}
                    loading={loading}
                />
                <SummaryCard
                    title="Chờ xét duyệt"
                    value={pendingCount}
                    icon={<Clock className="h-4 w-4" />}
                    variant="warning"
                    loading={loading}
                />
                <SummaryCard
                    title="Đã chấp thuận"
                    value={approvedCount}
                    icon={<CheckCircle className="h-4 w-4" />}
                    variant="success"
                    loading={loading}
                />
                <SummaryCard
                    title="Đã từ chối"
                    value={rejectedCount}
                    icon={<XCircle className="h-4 w-4" />}
                    variant="destructive"
                    loading={loading}
                />
            </div>

            <Card>
                <CardContent className="space-y-4">
                    {error ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {error}
                        </div>
                    ) : null}

                    <DataTableToolbar
                        table={table}
                        searchPlaceholder="Tìm theo tên, email, công ty"
                        filters={[{ columnId: "trangThai", title: "Trạng thái", options: statusFilterOptions }]}
                    />

                    <div className="overflow-hidden rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id} className="border-b bg-muted/30">
                                            {headerGroup.headers.map((header) => {
                                                const isActionColumn = header.column.id === "thaoTac";

                                                return (
                                                    <th
                                                        key={header.id}
                                                        colSpan={header.colSpan}
                                                        className={cn(
                                                            "h-11 px-3 align-middle font-medium text-muted-foreground",
                                                            "text-left",
                                                            isActionColumn && "text-right",
                                                        )}
                                                    >
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 6 }).map((_, rowIndex) => (
                                              <tr key={rowIndex} className="border-b">
                                                  {columns.map((column) => (
                                                      <td
                                                          key={column.id?.toString()}
                                                          className={cn(
                                                              "px-3 py-3 align-top",
                                                              column.id === "thaoTac" && "text-right",
                                                          )}
                                                      >
                                                          <Skeleton className="h-6 w-full" />
                                                      </td>
                                                  ))}
                                              </tr>
                                          ))
                                        : null}

                                    {!loading && table.getRowModel().rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={table.getVisibleLeafColumns().length}
                                                className="h-24 px-3 text-center text-muted-foreground"
                                            >
                                                Không tìm thấy yêu cầu phù hợp.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!loading
                                        ? table.getRowModel().rows.map((row) => (
                                              <tr
                                                  key={row.id}
                                                  className="border-b align-top transition-colors hover:bg-muted/30"
                                              >
                                                  {row.getVisibleCells().map((cell) => {
                                                      const isActionColumn = cell.column.id === "thaoTac";

                                                      return (
                                                          <td
                                                              key={cell.id}
                                                              className={cn("px-3 py-3 align-top", isActionColumn && "text-right")}
                                                          >
                                                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                          </td>
                                                      );
                                                  })}
                                              </tr>
                                          ))
                                        : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <DataTablePagination table={table} className="mt-auto" />
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setDialogOpen(true))}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Xét duyệt yêu cầu nâng cấp BusAdmin</DialogTitle>
                        <DialogDescription>
                            Xem chi tiết yêu cầu và quyết định chấp thuận hoặc từ chối.
                        </DialogDescription>
                    </DialogHeader>

                    {reviewingRequest && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4">
                                <h3 className="mb-3 font-medium">Người yêu cầu</h3>
                                <div className="space-y-2 text-sm">
                                    <InfoRow label="Họ tên" value={reviewingRequest.requesterName || "Chưa cung cấp"} />
                                    <InfoRow label="Email" value={reviewingRequest.requesterEmail || "Chưa cung cấp"} />
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <h3 className="mb-3 font-medium">Thông tin công ty</h3>
                                <div className="space-y-2 text-sm">
                                    <InfoRow label="Tên công ty" value={reviewingRequest.companyName} />
                                    <InfoRow
                                        label="Số giấy phép"
                                        value={reviewingRequest.licenseNumber || "Chưa cung cấp"}
                                    />
                                    <InfoRow label="Hotline" value={reviewingRequest.hotline || "Chưa cung cấp"} />
                                </div>
                            </div>

                            {reviewingRequest.reason && (
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-3 font-medium">Lý do nâng cấp</h3>
                                    <p className="text-sm text-muted-foreground">{reviewingRequest.reason}</p>
                                </div>
                            )}

                            {reviewingRequest.status !== STATUS_PENDING && (
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-3 font-medium">Kết quả xét duyệt</h3>
                                    <div className="space-y-2 text-sm">
                                        <InfoRow
                                            label="Trạng thái"
                                            value={
                                                <Badge variant={getStatusBadgeVariant(reviewingRequest.status)}>
                                                    {formatStatus(reviewingRequest.status)}
                                                </Badge>
                                            }
                                        />
                                        {reviewingRequest.reviewedAt && (
                                            <InfoRow label="Ngày xét duyệt" value={formatDateTime(reviewingRequest.reviewedAt)} />
                                        )}
                                        {reviewingRequest.reviewedBy && (
                                            <InfoRow
                                                label="Người xét duyệt"
                                                value={`${reviewingRequest.reviewedBy.fullName} (${reviewingRequest.reviewedBy.email})`}
                                            />
                                        )}
                                        {reviewingRequest.reviewNote && (
                                            <InfoRow label="Ghi chú" value={reviewingRequest.reviewNote} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {reviewingRequest.status === STATUS_PENDING && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ghi chú xét duyệt (tùy chọn)</label>
                                    <Textarea
                                        value={reviewForm.reviewNote}
                                        onChange={(e) => setReviewForm((prev) => ({ ...prev, reviewNote: e.target.value }))}
                                        placeholder="Nhập ghi chú về quyết định xét duyệt..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={submitting}>
                            {reviewingRequest?.status === STATUS_PENDING ? "Hủy" : "Đóng"}
                        </Button>
                        {reviewingRequest?.status === STATUS_PENDING && (
                            <>
                                <Button variant="destructive" onClick={() => void handleReview(false)} disabled={submitting}>
                                    {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Từ chối
                                </Button>
                                <Button onClick={() => void handleReview(true)} disabled={submitting}>
                                    {submitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Chấp thuận
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SummaryCard({
    title,
    value,
    icon,
    variant,
    loading,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    variant?: "default" | "warning" | "success" | "destructive";
    loading: boolean;
}) {
    const colorClass = variant === "warning"
        ? "text-yellow-600"
        : variant === "success"
          ? "text-green-600"
          : variant === "destructive"
            ? "text-red-600"
            : "";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={cn("text-muted-foreground", colorClass)}>{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{formatNumber(value)}</div>}
            </CardContent>
        </Card>
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

function formatStatus(status: BusAdminUpgradeRequestStatus): string {
    switch (status) {
        case STATUS_PENDING:
            return "Chờ xét duyệt";
        case STATUS_APPROVED:
            return "Đã chấp thuận";
        case STATUS_REJECTED:
            return "Đã từ chối";
        default:
            return String(status);
    }
}

function getStatusBadgeVariant(status: BusAdminUpgradeRequestStatus): "default" | "secondary" | "destructive" {
    switch (status) {
        case STATUS_PENDING:
            return "secondary";
        case STATUS_APPROVED:
            return "default";
        case STATUS_REJECTED:
            return "destructive";
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

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value);
}

function getApiErrorMessage(error: unknown, fallback: string) {
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
