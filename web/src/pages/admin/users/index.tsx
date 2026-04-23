import {
    deleteApiAdminSystemUsersByUserId,
    getApiAdminSystemUsers,
    postApiAdminSystemUsers,
    putApiAdminSystemUsersByUserId,
    type AdminCreateUserDto,
    type AdminUpdateUserDto,
} from "@/api";
import {
    DataTableBulkActions,
    DataTableColumnHeader,
    DataTablePagination,
    DataTableToolbar,
} from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type FilterFn,
    type PaginationState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table";
import { Pencil, Plus, RefreshCw, ShieldCheck, Trash2, UserCheck, UserCog, Users, UserX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type UserRoleValue = "Passenger" | "BusAdmin" | "SysAdmin";

type AdminUserListItem = {
    id: string;
    passengerId?: string | null;
    email: string;
    fullName: string;
    phoneNumber?: string | null;
    role: UserRoleValue;
    isActive: boolean;
    createdAt: string;
    bookingCount: number;
    ticketCount: number;
    notificationCount: number;
    upgradeRequestCount: number;
    managedCompanyCount: number;
    canBeDeleted: boolean;
};

type AdminUsersSummary = {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    passengerUsers: number;
    busAdminUsers: number;
    sysAdminUsers: number;
};

type AdminUsersListResponse = {
    items: AdminUserListItem[];
    totalCount: number;
    filteredCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: AdminUsersSummary;
};

type UserFormState = {
    email: string;
    fullName: string;
    phoneNumber: string;
    role: UserRoleValue;
    isActive: boolean;
    password: string;
};

const defaultSummary: AdminUsersSummary = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    passengerUsers: 0,
    busAdminUsers: 0,
    sysAdminUsers: 0,
};

const emptyForm: UserFormState = {
    email: "",
    fullName: "",
    phoneNumber: "",
    role: "Passenger",
    isActive: true,
    password: "",
};

const roleFilterOptions = [
    { label: "Hành khách", value: "Passenger" },
    { label: "Quản trị nhà xe", value: "BusAdmin" },
    { label: "Quản trị hệ thống", value: "SysAdmin" },
];

const statusFilterOptions = [
    { label: "Đang hoạt động", value: "active" },
    { label: "Đã khóa", value: "inactive" },
];

const roleFilterFn: FilterFn<AdminUserListItem> = (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
    }

    return filterValue.includes(row.getValue(columnId));
};

const statusFilterFn: FilterFn<AdminUserListItem> = (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
    }

    return filterValue.includes(row.getValue(columnId));
};

export function PageAdminUsers() {
    const [users, setUsers] = useState<AdminUserListItem[]>([]);
    const [summary, setSummary] = useState<AdminUsersSummary>(defaultSummary);
    const [totalCount, setTotalCount] = useState(0);
    const [filteredCount, setFilteredCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);
    const [form, setForm] = useState<UserFormState>(emptyForm);
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [sorting, setSorting] = useState<SortingState>([{ id: "ngayTao", desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const hasLoadedOnceRef = useRef(false);

    const roleFilterValues = useMemo(() => {
        const value = columnFilters.find((filter) => filter.id === "vaiTro")?.value;
        return Array.isArray(value) ? value.map(String) : [];
    }, [columnFilters]);

    const statusFilterValues = useMemo(() => {
        const value = columnFilters.find((filter) => filter.id === "trangThai")?.value;
        return Array.isArray(value) ? value.map(String) : [];
    }, [columnFilters]);

    const roleFilterKey = roleFilterValues.join("|");
    const statusFilterKey = statusFilterValues.join("|");

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
    }, [debouncedSearch, roleFilterKey, statusFilterKey]);

    const requestUsers = useCallback(async () => {
        const response = await getApiAdminSystemUsers({
            query: {
                ...(debouncedSearch ? { q: debouncedSearch } : {}),
                ...(roleFilterValues.length > 0 ? { roles: roleFilterValues } : {}),
                ...(statusFilterValues.length > 0 ? { statuses: statusFilterValues } : {}),
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
            },
        });

        if (response.error || !response.data) {
            throw new Error(getApiErrorMessage(response.error, "Không thể tải danh sách người dùng."));
        }

        return response.data as AdminUsersListResponse;
    }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, roleFilterValues, statusFilterValues]);

    const fetchUsers = useCallback(
        async (showRefreshing = hasLoadedOnceRef.current) => {
            if (!showRefreshing) {
                setLoading(true);
            }

            if (showRefreshing) {
                setRefreshing(true);
            }

            try {
                const data = await requestUsers();
                setUsers(data.items ?? []);
                setSummary(data.summary ?? defaultSummary);
                setTotalCount(data.totalCount ?? 0);
                setFilteredCount(data.filteredCount ?? 0);
                setTotalPages(Math.max(data.totalPages ?? 1, 1));
                setError(null);
                setRowSelection({});

                if (data.pageSize && data.pageSize !== pagination.pageSize) {
                    setPagination((current) => ({ ...current, pageSize: data.pageSize }));
                }

                if (typeof data.page === "number" && data.page - 1 !== pagination.pageIndex) {
                    setPagination((current) => ({ ...current, pageIndex: Math.max(data.page - 1, 0) }));
                }

                hasLoadedOnceRef.current = true;
            } catch (e) {
                console.error("Không thể tải danh sách người dùng", e);
                setUsers([]);
                setSummary(defaultSummary);
                setTotalCount(0);
                setFilteredCount(0);
                setTotalPages(1);
                setRowSelection({});
                setError(e instanceof Error ? e.message : "Không thể tải danh sách người dùng.");

                if (showRefreshing) {
                    toast.error("Làm mới danh sách người dùng thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [pagination.pageIndex, pagination.pageSize, requestUsers],
    );

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    const openCreateDialog = () => {
        setEditingUser(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEditDialog = (user: AdminUserListItem) => {
        setEditingUser(user);
        setForm({
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber ?? "",
            role: user.role,
            isActive: user.isActive,
            password: "",
        });
        setDialogOpen(true);
    };

    const resetDialog = () => {
        setDialogOpen(false);
        setEditingUser(null);
        setForm(emptyForm);
    };

    const updateUserRequest = useCallback(async (user: AdminUserListItem, nextIsActive: boolean) => {
        const body: AdminUpdateUserDto = {
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isActive: nextIsActive,
        };

        const response = await putApiAdminSystemUsersByUserId({
            path: { userId: user.id },
            body,
        });

        if (response.error) {
            throw new Error(getApiErrorMessage(response.error, "Không thể cập nhật trạng thái người dùng"));
        }
    }, []);

    const deleteUserRequest = useCallback(async (user: AdminUserListItem) => {
        const response = await deleteApiAdminSystemUsersByUserId({
            path: { userId: user.id },
        });

        if (response.error) {
            throw new Error(getApiErrorMessage(response.error, "Không thể xóa người dùng"));
        }
    }, []);

    const submitForm = async () => {
        if (!form.email.trim() || !form.fullName.trim()) {
            toast.error("Vui lòng nhập đầy đủ email và họ tên");
            return;
        }

        if (!editingUser && form.password.trim().length < 8) {
            toast.error("Mật khẩu phải có ít nhất 8 ký tự");
            return;
        }

        setSubmitting(true);

        try {
            if (editingUser) {
                const body: AdminUpdateUserDto = {
                    email: form.email.trim(),
                    fullName: form.fullName.trim(),
                    phoneNumber: form.phoneNumber.trim() || null,
                    role: form.role,
                    isActive: form.isActive,
                };

                const response = await putApiAdminSystemUsersByUserId({
                    path: { userId: editingUser.id },
                    body,
                });

                if (response.error) {
                    throw new Error(getApiErrorMessage(response.error, "Không thể cập nhật người dùng"));
                }

                toast.success("Cập nhật người dùng thành công");
            } else {
                const body: AdminCreateUserDto = {
                    email: form.email.trim(),
                    password: form.password.trim(),
                    fullName: form.fullName.trim(),
                    phoneNumber: form.phoneNumber.trim() || null,
                    role: form.role,
                    isActive: form.isActive,
                };

                const response = await postApiAdminSystemUsers({ body });

                if (response.error) {
                    throw new Error(getApiErrorMessage(response.error, "Không thể tạo người dùng"));
                }

                toast.success("Tạo người dùng thành công");
            }

            resetDialog();
            await fetchUsers(true);
        } catch (e) {
            console.error("Không thể lưu người dùng", e);
            toast.error(e instanceof Error ? e.message : "Không thể lưu người dùng");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleUserStatus = useCallback(
        async (user: AdminUserListItem) => {
            try {
                await updateUserRequest(user, !user.isActive);
                toast.success(user.isActive ? "Đã khóa tài khoản" : "Đã kích hoạt tài khoản");
                await fetchUsers(true);
            } catch (e) {
                console.error("Không thể cập nhật trạng thái người dùng", e);
                toast.error(e instanceof Error ? e.message : "Không thể cập nhật trạng thái người dùng");
            }
        },
        [fetchUsers, updateUserRequest],
    );

    const deleteUser = useCallback(
        async (user: AdminUserListItem) => {
            if (!user.canBeDeleted) {
                toast.error("Người dùng này đã phát sinh dữ liệu nên không thể xóa");
                return;
            }

            const confirmed = window.confirm(`Xóa người dùng ${user.fullName}? Hành động này không thể hoàn tác.`);
            if (!confirmed) {
                return;
            }

            try {
                await deleteUserRequest(user);
                toast.success("Xóa người dùng thành công");
                await fetchUsers(true);
            } catch (e) {
                console.error("Không thể xóa người dùng", e);
                toast.error(e instanceof Error ? e.message : "Không thể xóa người dùng");
            }
        },
        [deleteUserRequest, fetchUsers],
    );

    const columns = useMemo<ColumnDef<AdminUserListItem>[]>(
        () => [
            {
                id: "chon",
                header: ({ table }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())}
                    >
                        {table.getIsAllPageRowsSelected() ? "Bỏ" : "Chọn"}
                    </Button>
                ),
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => row.toggleSelected(!row.getIsSelected())}
                    >
                        {row.getIsSelected() ? "✓" : "○"}
                    </Button>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: "nguoiDung",
                accessorFn: (row) => `${row.fullName} ${row.email} ${row.phoneNumber ?? ""}`.toLowerCase(),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Người dùng" />,
                cell: ({ row }) => (
                    <div className="space-y-1">
                        <div className="font-medium">{row.original.fullName}</div>
                        <div className="text-muted-foreground">{row.original.email}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.phoneNumber || "Chưa có số điện thoại"}
                        </div>
                    </div>
                ),
            },
            {
                id: "vaiTro",
                accessorFn: (row) => row.role,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Vai trò" />,
                cell: ({ row }) => (
                    <Badge variant={roleBadgeVariant(row.original.role)}>{formatRole(row.original.role)}</Badge>
                ),
                filterFn: roleFilterFn,
            },
            {
                id: "trangThai",
                accessorFn: (row) => (row.isActive ? "active" : "inactive"),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
                cell: ({ row }) => (
                    <Badge variant={row.original.isActive ? "default" : "secondary"}>
                        {row.original.isActive ? "Đang hoạt động" : "Đã khóa"}
                    </Badge>
                ),
                filterFn: statusFilterFn,
            },
            {
                id: "hoatDong",
                accessorFn: (row) =>
                    row.bookingCount +
                    row.ticketCount +
                    row.notificationCount +
                    row.upgradeRequestCount +
                    row.managedCompanyCount,
                header: ({ column }) => <DataTableColumnHeader column={column} title="Hoạt động" />,
                cell: ({ row }) => (
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Đơn đặt: {formatNumber(row.original.bookingCount)}</div>
                        <div>Vé: {formatNumber(row.original.ticketCount)}</div>
                        <div>Thông báo: {formatNumber(row.original.notificationCount)}</div>
                        <div>Yêu cầu nâng cấp: {formatNumber(row.original.upgradeRequestCount)}</div>
                        {row.original.managedCompanyCount > 0 ? (
                            <div>Nhà xe quản lý: {formatNumber(row.original.managedCompanyCount)}</div>
                        ) : null}
                    </div>
                ),
            },
            {
                id: "ngayTao",
                accessorFn: (row) => new Date(row.createdAt).getTime(),
                header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
                cell: ({ row }) => (
                    <div className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</div>
                ),
            },
            {
                id: "thaoTac",
                header: () => <div className="text-right">Thao tác</div>,
                cell: ({ row }) => (
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(row.original)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Sửa
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void toggleUserStatus(row.original)}>
                            <UserCog className="mr-1 h-3.5 w-3.5" />
                            {row.original.isActive ? "Khóa" : "Mở khóa"}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void deleteUser(row.original)}
                            disabled={!row.original.canBeDeleted}
                        >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Xóa
                        </Button>
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [deleteUser, toggleUserStatus],
    );

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: users,
        columns,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
            columnFilters,
            globalFilter,
            pagination,
        },
        enableRowSelection: true,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        manualPagination: true,
        manualFiltering: true,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    const selectedUsers = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
    const allSelectedActive = selectedUsers.length > 0 && selectedUsers.every((user) => user.isActive);
    const allSelectedInactive = selectedUsers.length > 0 && selectedUsers.every((user) => !user.isActive);
    const allSelectedDeletable = selectedUsers.length > 0 && selectedUsers.every((user) => user.canBeDeleted);
    const filteredCountLabel =
        globalFilter || columnFilters.length > 0
            ? `${filteredCount} người dùng phù hợp bộ lọc`
            : `${totalCount || summary.totalUsers} người dùng toàn hệ thống`;

    const updateSelectedUsersStatus = async (nextIsActive: boolean) => {
        if (selectedUsers.length === 0) {
            return;
        }

        setBulkSubmitting(true);

        try {
            const results = await Promise.allSettled(
                selectedUsers.map((user) => updateUserRequest(user, nextIsActive)),
            );
            const failedCount = results.filter((result) => result.status === "rejected").length;
            const successCount = results.length - failedCount;

            if (successCount > 0) {
                toast.success(
                    nextIsActive ? `Đã kích hoạt ${successCount} tài khoản` : `Đã khóa ${successCount} tài khoản`,
                );
            }

            if (failedCount > 0) {
                toast.error(`${failedCount} tài khoản cập nhật thất bại`);
            }

            await fetchUsers(true);
        } catch (e) {
            console.error("Không thể cập nhật hàng loạt trạng thái người dùng", e);
            toast.error("Không thể cập nhật hàng loạt trạng thái người dùng");
        } finally {
            setBulkSubmitting(false);
        }
    };

    const deleteSelectedUsers = async () => {
        if (selectedUsers.length === 0) {
            return;
        }

        if (!allSelectedDeletable) {
            toast.error("Danh sách đã chọn có người dùng không thể xóa");
            return;
        }

        const confirmed = window.confirm(
            `Xóa ${selectedUsers.length} người dùng đã chọn? Hành động này không thể hoàn tác.`,
        );
        if (!confirmed) {
            return;
        }

        setBulkSubmitting(true);

        try {
            const results = await Promise.allSettled(selectedUsers.map((user) => deleteUserRequest(user)));
            const failedCount = results.filter((result) => result.status === "rejected").length;
            const successCount = results.length - failedCount;

            if (successCount > 0) {
                toast.success(`Đã xóa ${successCount} người dùng`);
            }

            if (failedCount > 0) {
                toast.error(`${failedCount} người dùng xóa thất bại`);
            }

            await fetchUsers(true);
        } catch (e) {
            console.error("Không thể xóa hàng loạt người dùng", e);
            toast.error("Không thể xóa hàng loạt người dùng");
        } finally {
            setBulkSubmitting(false);
        }
    };

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
                        <Badge variant="outline">{filteredCountLabel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi tài khoản hành khách, quản trị viên nhà xe và quản trị viên hệ thống.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => void fetchUsers(true)} disabled={loading || refreshing}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                        Làm mới
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo người dùng
                    </Button>
                </div>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    title="Tổng người dùng"
                    value={summary.totalUsers}
                    icon={<Users className="h-4 w-4" />}
                    loading={loading}
                />
                <SummaryCard
                    title="Đang hoạt động"
                    value={summary.activeUsers}
                    icon={<UserCheck className="h-4 w-4" />}
                    loading={loading}
                />
                <SummaryCard
                    title="Đã khóa"
                    value={summary.inactiveUsers}
                    icon={<UserX className="h-4 w-4" />}
                    loading={loading}
                />
                <SummaryCard
                    title="Hành khách"
                    value={summary.passengerUsers}
                    icon={<Users className="h-4 w-4" />}
                    loading={loading}
                />
                <SummaryCard
                    title="Quản trị"
                    value={summary.busAdminUsers + summary.sysAdminUsers}
                    icon={<ShieldCheck className="h-4 w-4" />}
                    loading={loading}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách tài khoản</CardTitle>
                    <CardDescription>
                        Dùng bộ lọc để tìm nhanh, sắp xếp dữ liệu và thao tác trực tiếp trên từng tài khoản.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {error}
                        </div>
                    ) : null}

                    <DataTableToolbar
                        table={table}
                        searchPlaceholder="Tìm theo email, họ tên, số điện thoại"
                        filters={[
                            { columnId: "trangThai", title: "Trạng thái", options: statusFilterOptions },
                            { columnId: "vaiTro", title: "Vai trò", options: roleFilterOptions },
                        ]}
                    />

                    <div className="overflow-hidden rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id} className="border-b bg-muted/30">
                                            {headerGroup.headers.map((header) => {
                                                const isActionColumn = header.column.id === "thaoTac";
                                                const isSelectColumn = header.column.id === "chon";

                                                return (
                                                    <th
                                                        key={header.id}
                                                        colSpan={header.colSpan}
                                                        className={cn(
                                                            "h-11 px-3 align-middle font-medium text-muted-foreground",
                                                            isSelectColumn ? "w-16 text-center" : "text-left",
                                                            isActionColumn && "text-right",
                                                        )}
                                                    >
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                  header.column.columnDef.header,
                                                                  header.getContext(),
                                                              )}
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
                                                              column.id === "chon" && "w-16 text-center",
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
                                                Không tìm thấy người dùng phù hợp.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!loading
                                        ? table.getRowModel().rows.map((row) => (
                                              <tr
                                                  key={row.id}
                                                  data-state={row.getIsSelected() ? "selected" : undefined}
                                                  className="border-b align-top transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted/40"
                                              >
                                                  {row.getVisibleCells().map((cell) => {
                                                      const isActionColumn = cell.column.id === "thaoTac";
                                                      const isSelectColumn = cell.column.id === "chon";

                                                      return (
                                                          <td
                                                              key={cell.id}
                                                              className={cn(
                                                                  "px-3 py-3 align-top",
                                                                  isSelectColumn && "w-16 text-center",
                                                                  isActionColumn && "text-right",
                                                              )}
                                                          >
                                                              {flexRender(
                                                                  cell.column.columnDef.cell,
                                                                  cell.getContext(),
                                                              )}
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

                    <DataTableBulkActions table={table} entityName="người dùng">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void updateSelectedUsersStatus(true)}
                            disabled={bulkSubmitting || allSelectedActive}
                        >
                            Kích hoạt
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void updateSelectedUsersStatus(false)}
                            disabled={bulkSubmitting || allSelectedInactive}
                        >
                            Khóa
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void deleteSelectedUsers()}
                            disabled={bulkSubmitting || !allSelectedDeletable}
                        >
                            Xóa
                        </Button>
                    </DataTableBulkActions>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? resetDialog() : setDialogOpen(true))}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "Cập nhật người dùng" : "Tạo người dùng mới"}</DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? "Cập nhật thông tin tài khoản, vai trò và trạng thái hoạt động."
                                : "Tạo mới tài khoản cho hành khách hoặc quản trị viên."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Họ và tên</label>
                            <Input
                                value={form.fullName}
                                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Số điện thoại</label>
                                <Input
                                    value={form.phoneNumber}
                                    onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Vai trò</label>
                                <Select
                                    value={form.role}
                                    onValueChange={(value) =>
                                        setForm((prev) => ({ ...prev, role: value as UserRoleValue }))
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Passenger">Hành khách</SelectItem>
                                        <SelectItem value="BusAdmin">Quản trị nhà xe</SelectItem>
                                        <SelectItem value="SysAdmin">Quản trị hệ thống</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!editingUser ? (
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Mật khẩu khởi tạo</label>
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder="Tối thiểu 8 ký tự"
                                />
                            </div>
                        ) : null}

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Trạng thái</label>
                            <Select
                                value={form.isActive ? "active" : "inactive"}
                                onValueChange={(value) =>
                                    setForm((prev) => ({ ...prev, isActive: value === "active" }))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Đang hoạt động</SelectItem>
                                    <SelectItem value="inactive">Đã khóa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={resetDialog} disabled={submitting}>
                            Hủy
                        </Button>
                        <Button onClick={() => void submitForm()} disabled={submitting}>
                            {submitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
                        </Button>
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
    loading,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    loading: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="text-2xl font-bold">{formatNumber(value)}</div>
                )}
            </CardContent>
        </Card>
    );
}

function formatRole(role: UserRoleValue) {
    switch (role) {
        case "Passenger":
            return "Hành khách";
        case "BusAdmin":
            return "Quản trị nhà xe";
        case "SysAdmin":
            return "Quản trị hệ thống";
        default:
            return role;
    }
}

function roleBadgeVariant(role: UserRoleValue): "default" | "secondary" | "outline" {
    switch (role) {
        case "SysAdmin":
            return "default";
        case "BusAdmin":
            return "secondary";
        default:
            return "outline";
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
