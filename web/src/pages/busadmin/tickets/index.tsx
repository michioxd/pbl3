import { getApiBusadminBusesTickets, getApiBusadminBusesStatsMonthly, type TicketStatus } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

const monthOptions = [
    ...Array.from({ length: 12 }).map((_, index) => ({
        label: `Tháng ${index + 1}`,
        value: String(index + 1),
    })),
];

type BusAdminTicketListItem = {
    ticketID: string;
    ticketCode: string;
    finalPrice: number;
    status: number;
    bookingTime: string;
    passenger: {
        passengerID?: string;
        fullName?: string | null;
        phoneNumber?: string | null;
        email?: string | null;
    };
    trip: {
        tripID: string;
        departureDate: string;
        departureTime: string;
        arrivalTime: string;
        routeName: string;
    };
    seat: {
        layoutID: string;
        seatLabel?: string | null;
        floor?: number;
    };
};

type BusAdminTicketsResponse = {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    records: BusAdminTicketListItem[];
};

const statusOptions = [
    { label: "Tất cả trạng thái", value: "all" },
    { label: "Đã xuất vé", value: "0" },
    { label: "Đã check-in", value: "1" },
    { label: "Đã hủy", value: "2" },
];

const formatTicketStatus = (status: number): string => {
    switch (status) {
        case 0:
            return "Đã xuất vé";
        case 1:
            return "Đã check-in";
        case 2:
            return "Đã hủy";
        default:
            return "Không rõ";
    }
};

const getTicketStatusVariant = (status: number): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 0:
            return "default";
        case 1:
            return "secondary";
        case 2:
            return "destructive";
        default:
            return "outline";
    }
};

const formatDateTime = (value: string): string =>
    new Date(value).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

export function PageBusAdminTickets() {
    const now = useMemo(() => new Date(), []);
    const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
    const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [tickets, setTickets] = useState<BusAdminTicketListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const hasLoadedOnceRef = useRef(false);

    const selectedStatus = useMemo(() => {
        const statusValue = columnFilters.find((filter) => filter.id === "status")?.value;
        if (Array.isArray(statusValue) && statusValue.length > 0) {
            return String(statusValue[0]);
        }

        if (typeof statusValue === "string") {
            return statusValue;
        }

        return "all";
    }, [columnFilters]);

    const columns = useMemo<ColumnDef<BusAdminTicketListItem>[]>(
        () => [
            {
                id: "ticketID",
                accessorKey: "ticketID",
                header: "ID Vé",
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground" title={row.original.ticketID}>
                        {row.original.ticketID.substring(0, 8)}...
                    </span>
                ),
            },
            {
                id: "ticketCode",
                accessorKey: "ticketCode",
                header: "Mã vé",
                cell: ({ row }) => (
                    <div className="font-mono text-xs">{row.original.ticketCode}</div>
                ),
            },
            {
                id: "passenger",
                accessorKey: "passenger",
                header: "Hành khách",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.passenger.fullName || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{row.original.passenger.phoneNumber || "--"}</div>
                    </div>
                ),
            },
            {
                id: "route",
                accessorKey: "trip",
                header: "Tuyến",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.trip.routeName}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(row.original.trip.departureTime)}</div>
                    </div>
                ),
            },
            {
                id: "seat",
                accessorKey: "seat",
                header: "Ghế",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.seat.seatLabel || "--"}</div>
                        <div className="text-xs text-muted-foreground">Tầng {row.original.seat.floor ?? "--"}</div>
                    </div>
                ),
            },
            {
                id: "finalPrice",
                accessorKey: "finalPrice",
                header: "Giá vé",
                cell: ({ row }) => (
                    <div className="text-right font-medium">{currencyFormatter.format(row.original.finalPrice)}</div>
                ),
            },
            {
                id: "status",
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <Badge variant={getTicketStatusVariant(row.original.status)}>
                        {formatTicketStatus(row.original.status)}
                    </Badge>
                ),
            },
            {
                id: "bookingTime",
                accessorKey: "bookingTime",
                header: "Thời gian đặt",
                cell: ({ row }) => formatDateTime(row.original.bookingTime),
            },
        ],
        [],
    );

    const table = useReactTable({
        data: tickets,
        columns,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        state: {
            columnFilters,
            pagination,
            globalFilter,
        },
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
    });

    const fetchTickets = useCallback(
        async (showRefreshing = hasLoadedOnceRef.current) => {
            if (!showRefreshing) {
                setLoading(true);
            }

            if (showRefreshing) {
                setRefreshing(true);
            }

            try {
                const statusParam: TicketStatus | undefined =
                    selectedStatus !== "all" ? (Number(selectedStatus) as TicketStatus) : undefined;

                const response = await getApiBusadminBusesTickets({
                    query: {
                        ...(statusParam !== undefined ? { status: statusParam } : {}),
                        page: pagination.pageIndex + 1,
                        pageSize: pagination.pageSize,
                    },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải danh sách vé.");
                }

                const data = response.data as BusAdminTicketsResponse;
                setTickets(data.records ?? []);
                setTotalPages(Math.max(data.totalPages ?? 1, 1));
                setTotalRecords(data.totalRecords ?? 0);

                if (typeof data.page === "number" && data.page - 1 !== pagination.pageIndex) {
                    setPagination((current) => ({ ...current, pageIndex: Math.max(data.page - 1, 0) }));
                }

                if (data.pageSize && data.pageSize !== pagination.pageSize) {
                    setPagination((current) => ({ ...current, pageSize: data.pageSize }));
                }

                setError(null);
                hasLoadedOnceRef.current = true;
            } catch (error) {
                console.error("Không thể tải danh sách vé", error);
                setTickets([]);
                setTotalPages(1);
                setTotalRecords(0);
                setError("Không thể tải danh sách vé.");

                if (showRefreshing) {
                    toast.error("Làm mới danh sách vé thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [pagination.pageIndex, pagination.pageSize, selectedStatus],
    );

    useEffect(() => {
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }, [selectedStatus]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await getApiBusadminBusesStatsMonthly({
                query: {
                    year: Number(yearFilter),
                    month: Number(monthFilter),
                },
            });
            if (response.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Không thể tải thống kê", error);
        } finally {
            setStatsLoading(false);
        }
    }, [monthFilter, yearFilter]);

    useEffect(() => {
        void fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        void fetchTickets();
    }, [fetchTickets]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý vé xe</h1>
                    <p className="text-sm text-muted-foreground">Theo dõi trạng thái vé đã bán và thông tin hành khách.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Tháng" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        className="w-24"
                        type="number"
                        min={2000}
                        max={3000}
                        value={yearFilter}
                        onChange={(event) => setYearFilter(event.target.value)}
                    />
                    <Button variant="outline" onClick={() => { fetchTickets(true); fetchStats(); }} disabled={refreshing || statsLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", (refreshing || statsLoading) && "animate-spin")} />
                        Làm mới
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <div className="text-2xl font-bold">{currencyFormatter.format(stats?.grossRevenue ?? 0)}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vé bán thành công</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <div className="text-2xl font-bold">{numberFormatter.format(stats?.soldTickets ?? 0)}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng chuyến xe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <div className="text-2xl font-bold">{numberFormatter.format(stats?.totalTrips ?? 0)}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỉ lệ hủy vé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.cancellationRatePercent ?? 0}%</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Danh sách vé</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {totalRecords} vé theo bộ lọc hiện tại.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Tìm kiếm ID vé, mã vé, SĐT..."
                            value={globalFilter ?? ""}
                            onChange={(event) => setGlobalFilter(String(event.target.value))}
                            className="w-full md:w-64"
                        />
                        <Select
                            value={selectedStatus}
                            onValueChange={(value) =>
                                setColumnFilters([{ id: "status", value: value === "all" ? [] : [value] }])
                            }
                        >
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-hidden rounded-md border">
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
                                                                  header.getContext(),
                                                              )}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <TableRow key={row.id}>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                                    Không có vé phù hợp.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Trang {pagination.pageIndex + 1} / {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.setPageIndex(totalPages - 1)}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Hiển thị</span>
                                    <Select
                                        value={String(pagination.pageSize)}
                                        onValueChange={(value) => table.setPageSize(Number(value))}
                                    >
                                        <SelectTrigger className="h-8 w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[25, 50, 100, 200].map((size) => (
                                                <SelectItem key={size} value={String(size)}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
