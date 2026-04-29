import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    type SortingState,
    getSortedRowModel,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { getApiAdminSystemRoutesPerformance } from "@/api";
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
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type RoutePerformance = {
    routeID: string;
    routeName: string;
    companyName: string;
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    completionRate: number;
    averageOccupancy: number;
    totalRevenue: number;
};

type RoutePerformanceListResponse = {
    items: RoutePerformance[];
    totalCount: number;
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

export function PageAdminRoutePerformance() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [data, setData] = useState<RoutePerformanceListResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await getApiAdminSystemRoutesPerformance();
                if (response.error) {
                    throw new Error("Lỗi khi tải dữ liệu");
                }
                setData(response.data as RoutePerformanceListResponse);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const columns: ColumnDef<RoutePerformance>[] = [
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
            accessorKey: "totalTrips",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Tổng chuyến
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="text-center">
                    <div className="font-medium">{row.original.totalTrips}</div>
                    <div className="text-xs text-muted-foreground">
                        {row.original.completedTrips} hoàn thành
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "completionRate",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Tỷ lệ hoàn thành
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const rate = row.original.completionRate;
                return (
                    <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium">{rate.toFixed(1)}%</span>
                            <span className="text-muted-foreground">
                                {row.original.cancelledTrips} hủy
                            </span>
                        </div>
                        <Progress value={rate} className="h-2" />
                    </div>
                );
            },
        },
        {
            accessorKey: "averageOccupancy",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Lấp đầy TB
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const occupancy = row.original.averageOccupancy;
                return (
                    <div className="w-28">
                        <div className="text-xs mb-1 font-medium">
                            {occupancy.toFixed(1)}%
                        </div>
                        <Progress value={occupancy} className="h-2" />
                    </div>
                );
            },
        },
        {
            accessorKey: "totalRevenue",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Doanh thu
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatCurrency(row.original.totalRevenue)}
                </span>
            ),
        },
    ];

    const table = useReactTable({
        data: data?.items || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    // Calculate summary stats
    const summary = data?.items.reduce(
        (acc, route) => ({
            totalTrips: acc.totalTrips + route.totalTrips,
            totalCompleted: acc.totalCompleted + route.completedTrips,
            totalCancelled: acc.totalCancelled + route.cancelledTrips,
            totalRevenue: acc.totalRevenue + route.totalRevenue,
            routeCount: acc.routeCount + 1,
        }),
        {
            totalTrips: 0,
            totalCompleted: 0,
            totalCancelled: 0,
            totalRevenue: 0,
            routeCount: 0,
        }
    );

    const avgOccupancy = data?.items.length
        ? data.items.reduce((sum, r) => sum + r.averageOccupancy, 0) / data.items.length
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Hiệu suất tuyến đường
                </h1>
                <p className="text-muted-foreground">
                    Phân tích hiệu suất của từng tuyến đường
                </p>
            </div>

            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng tuyến đường
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.routeCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {summary.totalTrips} chuyến xe
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tỷ lệ hoàn thành
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.totalTrips > 0
                                    ? ((summary.totalCompleted / summary.totalTrips) * 100).toFixed(1)
                                    : 0}
                                %
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {summary.totalCancelled} chuyến bị hủy
                            </p>
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
                                {avgOccupancy.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Trung bình tất cả tuyến
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng doanh thu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tất cả tuyến đường
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách tuyến đường</CardTitle>
                    <CardDescription>
                        {data?.totalCount || 0} tuyến đường • Sắp xếp theo doanh thu
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </div>
    );
}
