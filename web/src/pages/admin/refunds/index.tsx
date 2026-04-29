import {
    getApiAdminSystemRefunds,
    postApiAdminSystemRefundsByRefundRequestIdApprove,
    postApiAdminSystemRefundsByRefundRequestIdReject,
} from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    DollarSign,
    RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { RefundDetailDialog } from "./components/RefundDetailDialog";

type RefundRequestListItem = {
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
};

type RefundRequestSummary = {
    totalRequests: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    pendingAmount: number;
    approvedAmount: number;
};

type RefundRequestsListResponse = {
    items: RefundRequestListItem[];
    totalCount: number;
    filteredCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: RefundRequestSummary;
};

export function PageAdminRefunds() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refunds, setRefunds] = useState<RefundRequestListItem[]>([]);
    const [summary, setSummary] = useState<RefundRequestSummary>({
        totalRequests: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 25,
    });
    const [totalPages, setTotalPages] = useState(1);
    const hasLoadedOnceRef = useRef(false);

    // Dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState<RefundRequestListItem | null>(null);

    const columns = useMemo<ColumnDef<RefundRequestListItem>[]>(
        () => [
            {
                id: "contactName",
                accessorKey: "contactName",
                header: "Người yêu cầu",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.contactName}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.contactEmail}
                        </div>
                    </div>
                ),
            },
            {
                id: "tripRoute",
                accessorKey: "tripRoute",
                header: "Chuyến xe",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">
                            {row.original.tripRoute || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.companyName}
                        </div>
                    </div>
                ),
            },
            {
                id: "requestedAmount",
                accessorKey: "requestedAmount",
                header: "Số tiền",
                cell: ({ row }) => (
                    <div className="font-medium text-right">
                        {formatCurrency(row.original.requestedAmount)}
                    </div>
                ),
            },
            {
                id: "reason",
                accessorKey: "reason",
                header: "Lý do",
                cell: ({ row }) => (
                    <div className="max-w-xs truncate">{row.original.reason}</div>
                ),
            },
            {
                id: "status",
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <Badge variant={getRefundStatusBadgeVariant(row.original.status)}>
                        {formatRefundStatus(row.original.status)}
                    </Badge>
                ),
            },
            {
                id: "requestedAt",
                accessorKey: "requestedAt",
                header: "Ngày yêu cầu",
                cell: ({ row }) => formatDate(row.original.requestedAt),
            },
            {
                id: "actions",
                header: "Thao tác",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedRefund(row.original);
                                setDetailDialogOpen(true);
                            }}
                        >
                            Chi tiết
                        </Button>
                        {row.original.status === 0 && (
                            <>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApprove(row.original.refundRequestID)}
                                >
                                    Duyệt
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleReject(row.original.refundRequestID)}
                                >
                                    Từ chối
                                </Button>
                            </>
                        )}
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: refunds,
        columns,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        state: {
            globalFilter,
            columnFilters,
            pagination,
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
    });

    const statusFilterValue = (columnFilters.find((f) => f.id === "status")?.value as number[]) ?? [];
    const statusFilterKey = statusFilterValue.join(",");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(globalFilter.trim());
        }, 400);

        return () => {
            window.clearTimeout(timer);
        };
    }, [globalFilter]);

    const fetchRefunds = useCallback(
        async (showRefreshing = false) => {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const response = await getApiAdminSystemRefunds({
                    query: {
                        q: debouncedSearch || undefined,
                        statuses:
                            statusFilterValue.length > 0
                                ? statusFilterValue.map((s) => s.toString())
                                : undefined,
                        page: pagination.pageIndex + 1,
                        pageSize: pagination.pageSize,
                    },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải danh sách yêu cầu hoàn tiền");
                }

                const data = response.data as unknown as RefundRequestsListResponse;
                setRefunds(data.items ?? []);
                setSummary(data.summary);
                setTotalPages(data.totalPages ?? 1);
                setError(null);
            } catch (e) {
                console.error("Failed to load refunds", e);
                setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
                if (showRefreshing) {
                    toast.error("Làm mới thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
                hasLoadedOnceRef.current = true;
            }
        },
        [debouncedSearch, statusFilterValue, pagination]
    );

    useEffect(() => {
        setPagination((current) => {
            if (current.pageIndex === 0) return current;
            return { ...current, pageIndex: 0 };
        });
    }, [debouncedSearch, statusFilterKey]);

    useEffect(() => {
        if (hasLoadedOnceRef.current) {
            void fetchRefunds();
        }
    }, [debouncedSearch, statusFilterKey, pagination]);

    useEffect(() => {
        if (!hasLoadedOnceRef.current) {
            void fetchRefunds();
        }
    }, []);

    const handleApprove = async (refundRequestId: string) => {
        const notes = prompt("Ghi chú (tùy chọn):");
        if (notes === null) return;

        try {
            const response = await postApiAdminSystemRefundsByRefundRequestIdApprove({
                path: { refundRequestId },
                body: { adminNotes: notes || "Đã duyệt" },
            });

            if (response.error) {
                throw new Error("Không thể duyệt yêu cầu hoàn tiền");
            }

            toast.success("Đã duyệt yêu cầu hoàn tiền");
            await fetchRefunds(true);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể duyệt yêu cầu");
        }
    };

    const handleReject = async (refundRequestId: string) => {
        const notes = prompt("Lý do từ chối:");
        if (!notes) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }

        try {
            const response = await postApiAdminSystemRefundsByRefundRequestIdReject({
                path: { refundRequestId },
                body: { adminNotes: notes },
            });

            if (response.error) {
                throw new Error("Không thể từ chối yêu cầu hoàn tiền");
            }

            toast.success("Đã từ chối yêu cầu hoàn tiền");
            await fetchRefunds(true);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể từ chối yêu cầu");
        }
    };

    if (loading && !refunds.length) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý hoàn tiền</h1>
                    <p className="text-sm text-muted-foreground">
                        Xử lý yêu cầu hoàn tiền từ khách hàng
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => void fetchRefunds(true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Tổng yêu cầu"
                    value={summary.totalRequests.toString()}
                    icon={<DollarSign className="h-4 w-4" />}
                    loading={loading}
                />
                <SummaryCard
                    title="Chờ duyệt"
                    value={`${summary.pendingCount} (${formatCurrency(summary.pendingAmount)})`}
                    icon={<DollarSign className="h-4 w-4" />}
                    variant="warning"
                    loading={loading}
                />
                <SummaryCard
                    title="Đã duyệt"
                    value={`${summary.approvedCount} (${formatCurrency(summary.approvedAmount)})`}
                    icon={<DollarSign className="h-4 w-4" />}
                    variant="success"
                    loading={loading}
                />
                <SummaryCard
                    title="Đã từ chối"
                    value={summary.rejectedCount.toString()}
                    icon={<DollarSign className="h-4 w-4" />}
                    variant="destructive"
                    loading={loading}
                />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                    placeholder="Tìm theo tên, email, lý do..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={
                        statusFilterValue.length === 1 ? statusFilterValue[0].toString() : "all"
                    }
                    onValueChange={(value) => {
                        if (value === "all") {
                            setColumnFilters((prev) => prev.filter((f) => f.id !== "status"));
                        } else {
                            setColumnFilters((prev) => [
                                ...prev.filter((f) => f.id !== "status"),
                                { id: "status", value: [Number(value)] },
                            ]);
                        }
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="0">Chờ duyệt</SelectItem>
                        <SelectItem value="2">Đã duyệt</SelectItem>
                        <SelectItem value="5">Đã từ chối</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {loading
                                    ? Array.from({ length: 6 }).map((_, rowIndex) => (
                                          <TableRow key={rowIndex}>
                                              {columns.map((column) => (
                                                  <TableCell key={column.id?.toString()}>
                                                      <Skeleton className="h-6 w-full" />
                                                  </TableCell>
                                              ))}
                                          </TableRow>
                                      ))
                                    : table.getRowModel().rows.length > 0
                                      ? table.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                      : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={columns.length}
                                                    className="h-24 text-center"
                                                >
                                                    Không có yêu cầu hoàn tiền nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t px-4 py-4">
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị {refunds.length} / {summary.totalRequests} yêu cầu
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Số dòng</p>
                                <Select
                                    value={pagination.pageSize.toString()}
                                    onValueChange={(value) => {
                                        setPagination({
                                            pageIndex: 0,
                                            pageSize: Number(value),
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="200">200</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1">
                                <p className="text-sm font-medium">
                                    Trang {pagination.pageIndex + 1} / {totalPages}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.setPageIndex(totalPages - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <RefundDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                refund={selectedRefund}
                onSuccess={() => void fetchRefunds(true)}
            />
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
    value: string;
    icon: React.ReactNode;
    variant?: "default" | "success" | "warning" | "destructive";
    loading: boolean;
}) {
    const colorClass =
        variant === "success"
            ? "text-green-600"
            : variant === "warning"
              ? "text-yellow-600"
              : variant === "destructive"
                ? "text-red-600"
                : "text-blue-600";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={cn("text-muted-foreground", colorClass)}>{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    );
}

function formatRefundStatus(status: number): string {
    switch (status) {
        case 0:
            return "Chờ duyệt";
        case 1:
            return "Đã xử lý (cũ)";
        case 2:
            return "Đã duyệt";
        case 3:
            return "Đang xử lý";
        case 4:
            return "Hoàn tất";
        case 5:
            return "Đã từ chối";
        case 6:
            return "Thất bại";
        default:
            return "Không xác định";
    }
}

function getRefundStatusBadgeVariant(
    status: number
): "default" | "secondary" | "outline" | "destructive" {
    switch (status) {
        case 0:
            return "outline"; // Pending
        case 2:
        case 4:
            return "default"; // Approved/Completed
        case 3:
            return "secondary"; // Processing
        case 5:
        case 6:
            return "destructive"; // Rejected/Failed
        default:
            return "outline";
    }
}

function formatDate(value: string) {
    if (!value) return "N/A";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
}
