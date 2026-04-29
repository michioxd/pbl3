import {
    getApiAdminSystemTransactions,
    type PaymentIntentStatus,
    type PaymentProvider,
} from "@/api";
import {
    DataTableColumnHeader,
    DataTablePagination,
    DataTableToolbar,
} from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    ArrowDownUp,
    Banknote,
    CheckCircle,
    Clock,
    DollarSign,
    RefreshCw,
    TrendingDown,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// Local type definitions until OpenAPI regeneration
type TransactionListItemDto = {
    intentID: string;
    bookingID: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    createdAt: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    bookingStatus: number;
    userID?: string | null;
    userEmail?: string | null;
    userFullName?: string | null;
    ticketCount: number;
    hasRefund: boolean;
    refundAmount?: number | null;
};

type TransactionSummaryDto = {
    totalTransactions: number;
    totalAmount: number;
    succeededCount: number;
    succeededAmount: number;
    failedCount: number;
    createdCount: number;
    refundedCount: number;
    refundedAmount: number;
    amountByProvider: Record<string, number>;
};

type TransactionListResponseDto = {
    records: TransactionListItemDto[];
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    summary: TransactionSummaryDto;
};

const providerFilterOptions = [
    { label: "Momo", value: "0" },
    { label: "Stripe", value: "1" },
    { label: "Tiền mặt", value: "2" },
];

const statusFilterOptions = [
    { label: "Đã tạo", value: "0" },
    { label: "Thành công", value: "1" },
    { label: "Thất bại", value: "2" },
];

const providerFilterFn: FilterFn<TransactionListItemDto> = (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
    }

    const rowProvider = String(row.getValue(columnId));
    return filterValue.includes(rowProvider);
};

const statusFilterFn: FilterFn<TransactionListItemDto> = (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
    }

    const rowStatus = String(row.getValue(columnId));
    return filterValue.includes(rowStatus);
};

export function PageAdminTransactions() {
    const [transactions, setTransactions] = useState<TransactionListItemDto[]>([]);
    const [summary, setSummary] = useState<TransactionSummaryDto | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([{ id: "ngayTao", desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
    const hasLoadedOnceRef = useRef(false);

    const providerFilterValues = useMemo(() => {
        const value = columnFilters.find((filter) => filter.id === "nhaCungCap")?.value;
        return Array.isArray(value) ? value.map(String) : [];
    }, [columnFilters]);

    const statusFilterValues = useMemo(() => {
        const value = columnFilters.find((filter) => filter.id === "trangThai")?.value;
        return Array.isArray(value) ? value.map(String) : [];
    }, [columnFilters]);

    const filterKey = `${providerFilterValues.join("|")}_${statusFilterValues.join("|")}`;

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(globalFilter.trim());
        }, 400);

        return () => {
            window.clearTimeout(timer);
        };
    }, [globalFilter]);

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
    }, [debouncedSearch, filterKey]);

    const requestData = useCallback(async () => {
        const providerParam: PaymentProvider | undefined =
            providerFilterValues.length === 1 ? (Number(providerFilterValues[0]) as PaymentProvider) : undefined;

        const statusParam: PaymentIntentStatus | undefined =
            statusFilterValues.length === 1 ? (Number(statusFilterValues[0]) as PaymentIntentStatus) : undefined;

        const response = await getApiAdminSystemTransactions({
            query: {
                ...(providerParam !== undefined ? { provider: providerParam } : {}),
                ...(statusParam !== undefined ? { status: statusParam } : {}),
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
            },
        });

        if (response.error || !response.data) {
            throw new Error(getApiErrorMessage(response.error, "Không thể tải danh sách giao dịch."));
        }

        return response.data as unknown as TransactionListResponseDto;
    }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, providerFilterValues, statusFilterValues]);

    const fetchTransactions = useCallback(
        async (showRefreshing = hasLoadedOnceRef.current) => {
            if (!showRefreshing) {
                setLoading(true);
            }

            if (showRefreshing) {
                setRefreshing(true);
            }

            try {
                const data = await requestData();
                setTransactions(data.records ?? []);
                setSummary(data.summary);
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
                console.error("Không thể tải danh sách giao dịch", e);
                setTransactions([]);
                setSummary(null);
                setTotalRecords(0);
                setTotalPages(1);
                setError(e instanceof Error ? e.message : "Không thể tải danh sách giao dịch.");

                if (showRefreshing) {
                    toast.error("Làm mới danh sách giao dịch thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [pagination.pageIndex, pagination.pageSize, requestData],
    );

    useEffect(() => {
        void fetchTransactions();
    }, [fetchTransactions]);

    const columns = useMemo<ColumnDef<TransactionListItemDto>[]>(
        () => [
            {
                id: "bookingID",
                accessorFn: (row) => row.bookingID,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Mã đặt vé" />,
                cell: ({ row }) => <div className="font-mono text-xs">{row.original.bookingID.slice(0, 8)}</div>,
            },
            {
                id: "khachHang",
                accessorFn: (row) =>
                    `${row.contactName ?? ""} ${row.contactEmail ?? ""} ${row.userEmail ?? ""}`.toLowerCase(),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Khách hàng" />,
                cell: ({ row }) => (
                    <div className="space-y-1">
                        <div className="font-medium">{row.original.contactName || row.original.userFullName || "Guest"}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.contactEmail || row.original.userEmail || "N/A"}
                        </div>
                    </div>
                ),
            },
            {
                id: "nhaCungCap",
                accessorFn: (row) => row.provider,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Phương thức" />,
                cell: ({ row }) => <Badge variant="outline">{formatProvider(row.original.provider)}</Badge>,
                filterFn: providerFilterFn,
            },
            {
                id: "soTien",
                accessorFn: (row) => row.amount,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Số tiền" />,
                cell: ({ row }) => (
                    <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(row.original.amount)}</div>
                        {row.original.hasRefund && row.original.refundAmount && (
                            <div className="text-xs text-red-600">Hoàn: {formatCurrency(row.original.refundAmount)}</div>
                        )}
                    </div>
                ),
            },
            {
                id: "trangThai",
                accessorFn: (row) => row.status,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
                cell: ({ row }) => (
                    <Badge variant={getStatusBadgeVariant(row.original.status)}>{formatStatus(row.original.status)}</Badge>
                ),
                filterFn: statusFilterFn,
            },
            {
                id: "soVe",
                accessorFn: (row) => row.ticketCount,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Số vé" />,
                cell: ({ row }) => <div className="text-center">{row.original.ticketCount}</div>,
            },
            {
                id: "ngayTao",
                accessorFn: (row) => new Date(row.createdAt).getTime(),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
                cell: ({ row }) => <div className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</div>,
            },
        ],
        [],
    );

    const table = useReactTable({
        data: transactions,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Lịch sử giao dịch</h1>
                        <Badge variant="outline">{totalRecords} giao dịch</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi toàn bộ giao dịch thanh toán và dòng tiền trong hệ thống.
                    </p>
                </div>

                <Button variant="outline" onClick={() => void fetchTransactions(true)} disabled={loading || refreshing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            {summary && (
                <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Tổng giao dịch"
                        value={summary.totalTransactions}
                        icon={<ArrowDownUp className="h-4 w-4" />}
                        loading={loading}
                    />
                    <SummaryCard
                        title="Doanh thu"
                        value={summary.succeededAmount}
                        valueFormatter={formatCurrency}
                        subtitle={`${summary.succeededCount} giao dịch thành công`}
                        icon={<DollarSign className="h-4 w-4" />}
                        variant="success"
                        loading={loading}
                    />
                    <SummaryCard
                        title="Hoàn tiền"
                        value={summary.refundedAmount}
                        valueFormatter={formatCurrency}
                        subtitle={`${summary.refundedCount} yêu cầu hoàn tiền`}
                        icon={<TrendingDown className="h-4 w-4" />}
                        variant="destructive"
                        loading={loading}
                    />
                    <SummaryCard
                        title="Đang xử lý"
                        value={summary.createdCount + summary.failedCount}
                        subtitle={`${summary.failedCount} thất bại`}
                        icon={<Clock className="h-4 w-4" />}
                        variant="warning"
                        loading={loading}
                    />
                </div>
            )}

            <Card>
                <CardContent className="space-y-4">
                    {error ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {error}
                        </div>
                    ) : null}

                    <DataTableToolbar
                        table={table}
                        searchPlaceholder="Tìm theo mã booking, email khách hàng"
                        filters={[
                            { columnId: "trangThai", title: "Trạng thái", options: statusFilterOptions },
                            { columnId: "nhaCungCap", title: "Phương thức", options: providerFilterOptions },
                        ]}
                    />

                    <div className="overflow-hidden rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id} className="border-b bg-muted/30">
                                            {headerGroup.headers.map((header) => (
                                                <th
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                    className="h-11 px-3 text-left align-middle font-medium text-muted-foreground"
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 6 }).map((_, rowIndex) => (
                                              <tr key={rowIndex} className="border-b">
                                                  {columns.map((column) => (
                                                      <td key={column.id?.toString()} className="px-3 py-3 align-top">
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
                                                Không tìm thấy giao dịch phù hợp.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!loading
                                        ? table.getRowModel().rows.map((row) => (
                                              <tr
                                                  key={row.id}
                                                  className="border-b align-top transition-colors hover:bg-muted/30"
                                              >
                                                  {row.getVisibleCells().map((cell) => (
                                                      <td key={cell.id} className="px-3 py-3 align-top">
                                                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                      </td>
                                                  ))}
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
        </>
    );
}

function SummaryCard({
    title,
    value,
    valueFormatter,
    subtitle,
    icon,
    variant,
    loading,
}: {
    title: string;
    value: number;
    valueFormatter?: (v: number) => string;
    subtitle?: string;
    icon: React.ReactNode;
    variant?: "default" | "warning" | "success" | "destructive";
    loading: boolean;
}) {
    const colorClass =
        variant === "warning"
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
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <>
                        <div className="text-2xl font-bold">
                            {valueFormatter ? valueFormatter(value) : formatNumber(value)}
                        </div>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    </>
                )}
            </CardContent>
        </Card>
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
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
