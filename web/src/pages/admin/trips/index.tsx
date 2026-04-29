import { useState, useEffect } from "react";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { getApiAdminSystemTrips, getApiAdminSystemTripsActive } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Search, Eye } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { TripDetailDialog } from "./components/TripDetailDialog";

type TripMonitoringListItem = {
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
};

type TripMonitoringSummary = {
    totalTrips: number;
    activeTrips: number;
    scheduledTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalRevenue: number;
    averageOccupancy: number;
};

type TripsMonitoringListResponse = {
    items: TripMonitoringListItem[];
    totalCount: number;
    filteredCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: TripMonitoringSummary;
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

export function PageAdminTrips() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [liveViewOnly, setLiveViewOnly] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 400);
    const [selectedTrip, setSelectedTrip] = useState<TripMonitoringListItem | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery, statusFilter, pageSize]);

    const [data, setData] = useState<TripsMonitoringListResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (liveViewOnly) {
                    const response = await getApiAdminSystemTripsActive();
                    if (response.error) throw new Error("Lỗi khi tải dữ liệu");

                    const items = (response.data || []) as TripMonitoringListItem[];
                    setData({
                        items,
                        totalCount: items.length,
                        filteredCount: items.length,
                        page: 1,
                        pageSize: items.length,
                        totalPages: 1,
                        summary: {
                            totalTrips: 0,
                            activeTrips: items.length,
                            scheduledTrips: 0,
                            completedTrips: 0,
                            cancelledTrips: 0,
                            totalRevenue: 0,
                            averageOccupancy: 0,
                        },
                    });
                } else {
                    const params: Record<string, string | number> = {
                        page,
                        pageSize,
                    };

                    if (debouncedSearchQuery) {
                        params.q = debouncedSearchQuery;
                    }

                    if (statusFilter !== "all") {
                        params.statuses = statusFilter;
                    }

                    const response = await getApiAdminSystemTrips(params);
                    if (response.error) {
                        throw new Error("Lỗi khi tải dữ liệu");
                    }

                    setData(response.data as TripsMonitoringListResponse);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [page, pageSize, debouncedSearchQuery, statusFilter, liveViewOnly]);

    const columns: ColumnDef<TripMonitoringListItem>[] = [
        {
            accessorKey: "routeName",
            header: "Tuyến đường",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.routeName}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.companyName}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "busPlateNumber",
            header: "Xe",
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {row.original.busPlateNumber || "Chưa phân"}
                </span>
            ),
        },
        {
            accessorKey: "departureTime",
            header: "Giờ khởi hành",
            cell: ({ row }) => (
                <div className="text-sm">
                    {formatDateTime(row.original.departureTime)}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const statusInfo = formatTripStatus(row.original.status);
                return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
            },
        },
        {
            accessorKey: "occupancy",
            header: "Lấp đầy",
            cell: ({ row }) => {
                const occupancy = (row.original.bookedSeats / row.original.totalSeats) * 100;
                return (
                    <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span>
                                {row.original.bookedSeats}/{row.original.totalSeats}
                            </span>
                            <span className="text-muted-foreground">
                                {occupancy.toFixed(0)}%
                            </span>
                        </div>
                        <Progress value={occupancy} className="h-2" />
                    </div>
                );
            },
        },
        {
            accessorKey: "revenue",
            header: "Doanh thu",
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatCurrency(row.original.revenue)}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSelectedTrip(row.original);
                        setDetailDialogOpen(true);
                    }}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: data?.items || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: data?.totalPages || 0,
    });

    const summary = data?.summary;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Giám sát chuyến xe</h1>
                <p className="text-muted-foreground">
                    Theo dõi tất cả chuyến xe trên hệ thống
                </p>
            </div>

            {!liveViewOnly && summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng chuyến xe
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalTrips}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Đang hoạt động
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.activeTrips}</div>
                            <p className="text-xs text-muted-foreground">
                                Đang chạy hoặc sắp khởi hành
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Hoàn thành
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.completedTrips}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Lấp đầy TB
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.averageOccupancy.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Doanh thu: {formatCurrency(summary.totalRevenue)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách chuyến xe</CardTitle>
                            <CardDescription>
                                {liveViewOnly
                                    ? "Đang hiển thị chuyến xe đang hoạt động"
                                    : `${data?.filteredCount || 0} chuyến xe`}
                            </CardDescription>
                        </div>
                        <Button
                            variant={liveViewOnly ? "default" : "outline"}
                            onClick={() => setLiveViewOnly(!liveViewOnly)}
                        >
                            {liveViewOnly ? "Xem tất cả" : "Live view"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!liveViewOnly && (
                        <div className="mb-4 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm tuyến đường, nhà xe, biển số..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="0">Đã lên lịch</SelectItem>
                                    <SelectItem value="1">Đang chạy</SelectItem>
                                    <SelectItem value="2">Hoàn thành</SelectItem>
                                    <SelectItem value="3">Đã hủy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="rounded-md border">
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
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            Đang tải...
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
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
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            Không có kết quả.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {!liveViewOnly && (
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm text-muted-foreground">
                                    Hiển thị {((page - 1) * pageSize) + 1} -{" "}
                                    {Math.min(page * pageSize, data?.filteredCount || 0)} trong{" "}
                                    {data?.filteredCount || 0} kết quả
                                </p>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="25">25 / trang</SelectItem>
                                        <SelectItem value="50">50 / trang</SelectItem>
                                        <SelectItem value="100">100 / trang</SelectItem>
                                        <SelectItem value="200">200 / trang</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Trước
                                </Button>
                                <div className="text-sm">
                                    Trang {page} / {data?.totalPages || 1}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= (data?.totalPages || 1)}
                                >
                                    Sau
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TripDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                trip={selectedTrip}
            />
        </div>
    );
}
