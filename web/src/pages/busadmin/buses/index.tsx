import { getApiBusadminBusesCompany, deleteApiBusadminBusesById } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Edit, Plus, Trash2 } from "lucide-react";
import { BusDialog } from "./components/bus-dialog";

type BusAdminBusListItem = {
    busID: string;
    plateNumber?: string | null;
    isActive: boolean;
    busType: {
        busTypeID: string;
        name: string;
        totalSeats: number;
        amenities?: string | null;
    };
};

type BusAdminBusesResponse = {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    records: BusAdminBusListItem[];
};

const getBusStatusVariant = (isActive: boolean): "default" | "secondary" | "destructive" => {
    if (isActive) return "default";
    return "secondary";
};

export function PageBusAdminBuses() {
    const [buses, setBuses] = useState<BusAdminBusListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
    const [globalFilter, setGlobalFilter] = useState("");
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const hasLoadedOnceRef = useRef(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBus, setSelectedBus] = useState<BusAdminBusListItem | null>(null);

    const handleDelete = async (bus: BusAdminBusListItem) => {
        if (!confirm(`Bạn có chắc muốn xóa xe ${bus.plateNumber}?`)) {
            return;
        }

        try {
            const response = await deleteApiBusadminBusesById({
                path: { id: bus.busID }
            });
            if (response.error) {
                throw new Error("Không thể xóa xe");
            }
            toast.success("Đã xóa xe");
            void fetchBuses(true);
        } catch (error) {
            console.error(error);
            toast.error("Xóa xe thất bại");
        }
    };

    const columns = useMemo<ColumnDef<BusAdminBusListItem>[]>(
        () => [
            {
                id: "busID",
                accessorKey: "busID",
                header: "ID Xe",
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground" title={row.original.busID}>
                        {row.original.busID.substring(0, 8)}...
                    </span>
                ),
            },
            {
                id: "plateNumber",
                accessorKey: "plateNumber",
                header: "Biển số",
                cell: ({ row }) => (
                    <span className="font-mono text-sm">{row.original.plateNumber || "--"}</span>
                ),
            },
            {
                id: "busType",
                accessorKey: "busType",
                header: "Loại xe",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.busType.name}</div>
                        <div className="text-xs text-muted-foreground">{row.original.busType.totalSeats} ghế</div>
                    </div>
                ),
            },
            {
                id: "amenities",
                accessorKey: "busType",
                header: "Tiện ích",
                cell: ({ row }) => (
                    <div className="max-w-xs truncate text-xs text-muted-foreground">
                        {row.original.busType.amenities || "Chưa cập nhật"}
                    </div>
                ),
            },
            {
                id: "isActive",
                accessorKey: "isActive",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <Badge variant={getBusStatusVariant(row.original.isActive)}>
                        {row.original.isActive ? "Đang hoạt động" : "Tạm dừng"}
                    </Badge>
                ),
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
                                setSelectedBus(row.original);
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
        data: buses,
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

    const fetchBuses = useCallback(
        async (showRefreshing = hasLoadedOnceRef.current) => {
            if (!showRefreshing) {
                setLoading(true);
            }

            if (showRefreshing) {
                setRefreshing(true);
            }

            try {
                const response = await getApiBusadminBusesCompany({
                    query: {
                        page: pagination.pageIndex + 1,
                        pageSize: pagination.pageSize,
                    },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải danh sách xe.");
                }

                const data = response.data as BusAdminBusesResponse;
                setBuses(data.records ?? []);
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
                console.error("Không thể tải danh sách xe", error);
                setBuses([]);
                setTotalPages(1);
                setTotalRecords(0);
                setError("Không thể tải danh sách xe.");

                if (showRefreshing) {
                    toast.error("Làm mới danh sách xe thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [pagination.pageIndex, pagination.pageSize],
    );

    useEffect(() => {
        void fetchBuses();
    }, [fetchBuses]);

    const suggestedBusTypes = useMemo(() => {
        const map = new Map<string, string>(); // map label -> id
        buses.forEach(b => {
            if (b.busType.busTypeID && b.busType.name && !map.has(b.busType.name)) {
                map.set(b.busType.name, b.busType.busTypeID);
            }
        });
        return Array.from(map.entries()).map(([label, id]) => ({ id, label }));
    }, [buses]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Danh sách xe</h1>
                    <p className="text-sm text-muted-foreground">Quản lý thông tin xe thuộc nhà xe của bạn.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => {
                            setSelectedBus(null);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm xe mới
                    </Button>
                    <Button variant="outline" onClick={() => fetchBuses(true)} disabled={refreshing}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Làm mới
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Xe đang quản lý</CardTitle>
                        <p className="text-sm text-muted-foreground">{totalRecords} xe trong hệ thống.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Tìm kiếm ID, Biển số..."
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
                                                    Không có xe phù hợp.
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

            <BusDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                bus={selectedBus}
                onSuccess={() => void fetchBuses(true)}
                busTypes={suggestedBusTypes}
            />
        </div>
    );
}
