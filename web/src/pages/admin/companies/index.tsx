import {
    deleteApiAdminSystemCompaniesBulk,
    getApiAdminSystemCompanies,
    patchApiAdminSystemCompaniesBulkApprove,
    patchApiAdminSystemCompaniesBulkSuspend,
} from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
    type RowSelectionState,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Ban,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Edit,
    Eye,
    RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CompanyEditDialog } from "./components/CompanyEditDialog";
import { CompanyStatusChangeDialog } from "./components/CompanyStatusChangeDialog";

// Local types (will be replaced after OpenAPI regeneration)
type AdminCompanyListItem = {
    companyID: string;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    status: number;
    isApproved: boolean;
    createdAt: string;
    adminsCount: number;
    routesCount: number;
    busesCount: number;
    activeTripsCount: number;
    canBeDeleted: boolean;
};

type AdminCompanySummary = {
    totalCompanies: number;
    pendingCompanies: number;
    approvedCompanies: number;
    suspendedCompanies: number;
    rejectedCompanies: number;
};

type CompaniesListResponse = {
    items: AdminCompanyListItem[];
    totalCount: number;
    filteredCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: AdminCompanySummary;
};

export function PageAdminCompanies() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [companies, setCompanies] = useState<AdminCompanyListItem[]>([]);
    const [summary, setSummary] = useState<AdminCompanySummary>({
        totalCompanies: 0,
        pendingCompanies: 0,
        approvedCompanies: 0,
        suspendedCompanies: 0,
        rejectedCompanies: 0,
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
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const hasLoadedOnceRef = useRef(false);

    // Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<AdminCompanyListItem | null>(null);

    // Table columns
    const columns = useMemo<ColumnDef<AdminCompanyListItem>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: "name",
                accessorKey: "name",
                header: "Nhà xe",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.name}</div>
                        {row.original.licenseNumber && (
                            <div className="text-xs text-muted-foreground">
                                GP: {row.original.licenseNumber}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: "status",
                accessorKey: "status",
                header: "Trạng thái",
                cell: ({ row }) => (
                    <Badge variant={companyStatusBadgeVariant(row.original.status)}>
                        {formatCompanyStatus(row.original.status)}
                    </Badge>
                ),
            },
            {
                id: "adminsCount",
                accessorKey: "adminsCount",
                header: "Quản trị",
                cell: ({ row }) => (
                    <div className="text-center">{row.original.adminsCount}</div>
                ),
            },
            {
                id: "routesCount",
                accessorKey: "routesCount",
                header: "Tuyến",
                cell: ({ row }) => (
                    <div className="text-center">{row.original.routesCount}</div>
                ),
            },
            {
                id: "busesCount",
                accessorKey: "busesCount",
                header: "Xe",
                cell: ({ row }) => (
                    <div className="text-center">{row.original.busesCount}</div>
                ),
            },
            {
                id: "createdAt",
                accessorKey: "createdAt",
                header: "Ngày tạo",
                cell: ({ row }) => formatDate(row.original.createdAt),
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
                                setSelectedCompany(row.original);
                                setEditDialogOpen(true);
                            }}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Sửa
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/companies/${row.original.companyID}`)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data: companies,
        columns,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        state: {
            globalFilter,
            columnFilters,
            pagination,
            rowSelection,
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        onRowSelectionChange: setRowSelection,
        enableRowSelection: true,
    });

    // Get status filter value
    const statusFilterValue = (columnFilters.find((f) => f.id === "status")?.value as number[]) ?? [];
    const statusFilterKey = statusFilterValue.join(",");

    // Debounce search
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(globalFilter.trim());
        }, 400);

        return () => {
            window.clearTimeout(timer);
        };
    }, [globalFilter]);

    const fetchCompanies = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await getApiAdminSystemCompanies({
                query: {
                    q: debouncedSearch || undefined,
                    statuses: statusFilterValue.length > 0 ? statusFilterValue.map(s => s.toString()) : undefined,
                    page: pagination.pageIndex + 1,
                    pageSize: pagination.pageSize,
                },
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải danh sách nhà xe");
            }

            const data = response.data as unknown as CompaniesListResponse;
            setCompanies(data.items ?? []);
            setSummary(data.summary);
            setTotalPages(data.totalPages ?? 1);
            setError(null);
        } catch (e) {
            console.error("Failed to load companies", e);
            setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
            if (showRefreshing) {
                toast.error("Làm mới thất bại");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
            hasLoadedOnceRef.current = true;
        }
    }, [debouncedSearch, statusFilterValue, pagination]);

    // Reset to page 0 when filters change
    useEffect(() => {
        setPagination((current) => {
            if (current.pageIndex === 0) return current;
            return { ...current, pageIndex: 0 };
        });
    }, [debouncedSearch, statusFilterKey]);

    useEffect(() => {
        if (hasLoadedOnceRef.current) {
            void fetchCompanies();
        }
    }, [debouncedSearch, statusFilterKey, pagination]);

    useEffect(() => {
        if (!hasLoadedOnceRef.current) {
            void fetchCompanies();
        }
    }, []);

    // Bulk actions handlers
    const handleBulkApprove = async () => {
        const selectedIds = Object.keys(rowSelection).map((idx) => companies[Number(idx)].companyID);

        if (selectedIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một nhà xe");
            return;
        }

        try {
            const response = await patchApiAdminSystemCompaniesBulkApprove({
                body: { companyIds: selectedIds },
            });

            if (response.error) {
                throw new Error("Không thể duyệt nhà xe");
            }

            toast.success(`Đã duyệt ${selectedIds.length} nhà xe`);
            setRowSelection({});
            await fetchCompanies(true);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể duyệt nhà xe");
        }
    };

    const handleBulkSuspend = async () => {
        const selectedIds = Object.keys(rowSelection).map((idx) => companies[Number(idx)].companyID);

        if (selectedIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một nhà xe");
            return;
        }

        try {
            const response = await patchApiAdminSystemCompaniesBulkSuspend({
                body: { companyIds: selectedIds },
            });

            if (response.error) {
                throw new Error("Không thể tạm ngưng nhà xe");
            }

            toast.success(`Đã tạm ngưng ${selectedIds.length} nhà xe`);
            setRowSelection({});
            await fetchCompanies(true);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể tạm ngưng nhà xe");
        }
    };

    const handleBulkDelete = async () => {
        const selectedIds = Object.keys(rowSelection).map((idx) => companies[Number(idx)].companyID);

        if (selectedIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một nhà xe");
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.length} nhà xe? Hành động này không thể hoàn tác.`)) {
            return;
        }

        try {
            const response = await deleteApiAdminSystemCompaniesBulk({
                body: { companyIds: selectedIds },
            });

            if (response.error) {
                throw new Error("Không thể xóa nhà xe");
            }

            toast.success(`Đã xóa ${selectedIds.length} nhà xe`);
            setRowSelection({});
            await fetchCompanies(true);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể xóa nhà xe");
        }
    };

    if (loading && !companies.length) {
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
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý nhà xe</h1>
                    <p className="text-sm text-muted-foreground">
                        Quản lý các nhà xe đối tác trên hệ thống
                    </p>
                </div>

                <Button variant="outline" onClick={() => void fetchCompanies(true)} disabled={refreshing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Tổng số nhà xe"
                    value={summary.totalCompanies}
                    icon={<Building2 className="h-4 w-4" />}
                    loading={loading}
                />
                <SummaryCard
                    title="Chờ duyệt"
                    value={summary.pendingCompanies}
                    icon={<Clock className="h-4 w-4" />}
                    variant="warning"
                    loading={loading}
                />
                <SummaryCard
                    title="Đã duyệt"
                    value={summary.approvedCompanies}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    variant="success"
                    loading={loading}
                />
                <SummaryCard
                    title="Tạm ngưng"
                    value={summary.suspendedCompanies}
                    icon={<Ban className="h-4 w-4" />}
                    variant="destructive"
                    loading={loading}
                />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                    placeholder="Tìm theo tên hoặc giấy phép..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={statusFilterValue.length === 1 ? statusFilterValue[0].toString() : "all"}
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
                        <SelectItem value="1">Đã duyệt</SelectItem>
                        <SelectItem value="2">Tạm ngưng</SelectItem>
                        <SelectItem value="3">Đã từ chối</SelectItem>
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
                                                  Không tìm thấy nhà xe nào
                                              </TableCell>
                                          </TableRow>
                                      )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Bulk Actions Toolbar */}
                    {Object.keys(rowSelection).length > 0 && (
                        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
                            <p className="text-sm font-medium">
                                Đã chọn {Object.keys(rowSelection).length} nhà xe
                            </p>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="default" onClick={handleBulkApprove}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Duyệt
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleBulkSuspend}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Tạm ngưng
                                </Button>
                                <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                                    Xóa
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRowSelection({})}
                                >
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t px-4 py-4">
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị {companies.length} / {summary.totalCompanies} nhà xe
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

            {/* Dialogs */}
            <CompanyEditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                company={selectedCompany}
                onSuccess={() => void fetchCompanies(true)}
            />
            <CompanyStatusChangeDialog
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                company={selectedCompany}
                onSuccess={() => void fetchCompanies(true)}
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
    value: number;
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
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="text-2xl font-bold">{value.toLocaleString("vi-VN")}</div>
                )}
            </CardContent>
        </Card>
    );
}

function formatCompanyStatus(status: number): string {
    switch (status) {
        case 0:
            return "Chờ duyệt";
        case 1:
            return "Đã duyệt";
        case 2:
            return "Tạm ngưng";
        case 3:
            return "Đã từ chối";
        default:
            return "Không xác định";
    }
}

function companyStatusBadgeVariant(
    status: number
): "default" | "secondary" | "outline" | "destructive" {
    switch (status) {
        case 0:
            return "outline"; // Pending - yellow
        case 1:
            return "default"; // Approved - green
        case 2:
            return "destructive"; // Suspended - red
        case 3:
            return "secondary"; // Rejected - gray
        default:
            return "outline";
    }
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}
