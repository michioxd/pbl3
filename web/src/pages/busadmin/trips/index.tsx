import { getApiBusadminBusesTrips, deleteApiBusadminBusesTripsByTripId } from "@/api";
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
    Edit,
    Plus,
    Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TripDialog } from "./components/trip-dialog";

const monthOptions = [
    { label: "Tất cả", value: "all" },
    ...Array.from({ length: 12 }).map((_, index) => ({
        label: `Tháng ${index + 1}`,
        value: String(index + 1),
    })),
];

type BusAdminTripListItem = {
    tripID: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    status: number;
    routeID: string;
    routeName: string;
    busID?: string | null;
    busPlateNumber?: string | null;
    busTypeID: string;
    busTypeName?: string | null;
    ticketCount: number;
};

type BusAdminTripsResponse = {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    records: BusAdminTripListItem[];
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

const formatDate = (value: string): string =>
    new Date(value).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

const formatTime = (value: string): string =>
    new Date(value).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });

export function PageBusAdminTrips() {
    const now = useMemo(() => new Date(), []);
    const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
    const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
    const [trips, setTrips] = useState<BusAdminTripListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
    const [globalFilter, setGlobalFilter] = useState("");
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const hasLoadedOnceRef = useRef(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<BusAdminTripListItem | null>(null);

    const handleDelete = async (trip: BusAdminTripListItem) => {
        if (!confirm(`Bạn có chắc muốn xóa chuyến xe đến ${trip.routeName} lúc ${formatTime(trip.departureTime)}?`)) {
            return;
        }

        try {
            const response = await deleteApiBusadminBusesTripsByTripId({
                path: { tripId: trip.tripID }
            });
            if (response.error) {
                throw new Error("Không thể xóa chuyến xe");
            }
            toast.success("Đã xóa chuyến xe");
            void fetchTrips(true);
        } catch (error) {
            console.error(error);
            toast.error("Xóa chuyến xe thất bại");
        }
    };

    const columns = useMemo<ColumnDef<BusAdminTripListItem>[]>(
        () => [
            {
                id: "tripID",
                accessorKey: "tripID",
                header: "ID Chuyến",
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground" title={row.original.tripID}>
                        {row.original.tripID.substring(0, 8)}...
                    </span>
                ),
            },
            {
                id: "routeName",
                accessorKey: "routeName",
                header: "Tuyến",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.routeName}</div>
                        <div className="text-xs text-muted-foreground">{row.original.busTypeName || "--"}</div>
                    </div>
                ),
            },
            {
                id: "departureDate",
                accessorKey: "departureDate",
                header: "Khởi hành",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{formatDate(row.original.departureDate)}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(row.original.departureTime)}</div>
                    </div>
                ),
            },
            {
                id: "arrivalTime",
                accessorKey: "arrivalTime",
                header: "Đến nơi",
                cell: ({ row }) => formatTime(row.original.arrivalTime),
            },
            {
                id: "busPlateNumber",
                accessorKey: "busPlateNumber",
                header: "Xe",
                cell: ({ row }) => (
                    <span className="font-mono text-sm">{row.original.busPlateNumber || "Chưa phân"}</span>
                ),
            },
            {
                id: "ticketCount",
                accessorKey: "ticketCount",
                header: "Vé đã bán",
                cell: ({ row }) => <div className="text-center">{row.original.ticketCount}</div>,
            },
            {
                id: "status",
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => {
                    const status = formatTripStatus(row.original.status);
                    return <Badge variant={status.variant}>{status.label}</Badge>;
                },
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
                                setSelectedTrip(row.original);
                                setDialogOpen(true);
                            }}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Sửa
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(row.original)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                        </Button>
                    </div>
                ),
            },
        ],
        [],
    );

    const table = useReactTable({
        data: trips,
        columns,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        state: {
            pagination,
            globalFilter,
        },
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
    });

    const fetchTrips = useCallback(
        async (showRefreshing = hasLoadedOnceRef.current) => {
            if (!showRefreshing) {
                setLoading(true);
            }

            if (showRefreshing) {
                setRefreshing(true);
            }

            try {
                const month = monthFilter === "all" ? undefined : Number(monthFilter);
                const year = monthFilter === "all" ? undefined : Number(yearFilter);

                const response = await getApiBusadminBusesTrips({
                    query: {
                        ...(month && year ? { month, year } : {}),
                        page: pagination.pageIndex + 1,
                        pageSize: pagination.pageSize,
                    },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải danh sách chuyến xe.");
                }

                const data = response.data as BusAdminTripsResponse;
                setTrips(data.records ?? []);
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
                console.error("Không thể tải danh sách chuyến xe", error);
                setTrips([]);
                setTotalPages(1);
                setTotalRecords(0);
                setError("Không thể tải danh sách chuyến xe.");

                if (showRefreshing) {
                    toast.error("Làm mới chuyến xe thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [monthFilter, pagination.pageIndex, pagination.pageSize, yearFilter],
    );

    useEffect(() => {
        setPagination((current) => ({ ...current, pageIndex: 0 }));
    }, [monthFilter, yearFilter]);

    useEffect(() => {
        void fetchTrips();
    }, [fetchTrips]);

    const suggestedRoutes = useMemo(() => {
        const map = new Map<string, string>(); // map label -> id
        trips.forEach(t => {
            if (t.routeID && t.routeName && !map.has(t.routeName)) {
                map.set(t.routeName, t.routeID);
            }
        });
        return Array.from(map.entries()).map(([label, id]) => ({ id, label }));
    }, [trips]);

    const suggestedBusTypes = useMemo(() => {
        const map = new Map<string, string>(); // map label -> id
        trips.forEach(t => {
            if (t.busTypeID && t.busTypeName && !map.has(t.busTypeName)) {
                map.set(t.busTypeName, t.busTypeID);
            }
        });
        return Array.from(map.entries()).map(([label, id]) => ({ id, label }));
    }, [trips]);

    const suggestedBuses = useMemo(() => {
        const map = new Map<string, string>(); // map label -> id
        trips.forEach(t => {
            if (t.busID && t.busPlateNumber && !map.has(t.busPlateNumber)) {
                map.set(t.busPlateNumber, t.busID);
            }
        });
        return Array.from(map.entries()).map(([label, id]) => ({ id, label }));
    }, [trips]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chuyến xe</h1>
                    <p className="text-sm text-muted-foreground">Quản lý lịch chạy xe của nhà xe theo tháng.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => {
                            setSelectedTrip(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm chuyến xe
                    </Button>
                    <Button variant="outline" onClick={() => fetchTrips(true)} disabled={refreshing}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Làm mới
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Danh sách chuyến</CardTitle>
                        <p className="text-sm text-muted-foreground">{totalRecords} chuyến trong bộ lọc hiện tại.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-40">
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
                            className="w-28"
                            type="number"
                            min={2000}
                            max={3000}
                            value={yearFilter}
                            onChange={(event) => setYearFilter(event.target.value)}
                            disabled={monthFilter === "all"}
                        />
                        <Input
                            placeholder="Tìm kiếm ID, xe..."
                            value={globalFilter ?? ""}
                            onChange={(event) => setGlobalFilter(String(event.target.value))}
                            className="w-full md:w-64"
                        />
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
                                                    Không có chuyến xe phù hợp.
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

            <TripDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                trip={selectedTrip}
                onSuccess={() => void fetchTrips(true)}
                routes={suggestedRoutes}
                busTypes={suggestedBusTypes}
                buses={suggestedBuses}
            />
        </div>
    );
}
