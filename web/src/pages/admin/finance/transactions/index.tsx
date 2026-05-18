import { client } from "@/api/client.gen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CreditCard, DollarSign, RefreshCw, Search, TrendingUp, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PaymentIntentStatus = "Created" | "Succeeded" | "Failed";

type TransactionItem = {
    id: string;
    bookingId: string;
    provider: string;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    createdAt: string | null;
    booking: {
        id: string;
        contactName: string;
        contactEmail: string;
        contactPhone: string;
        totalAmount: number;
        status: string;
    } | null;
    user: {
        id: string;
        email: string;
        fullName: string;
    } | null;
    company: {
        id: string;
        companyName: string;
    } | null;
    refundCount: number;
    refundAmount: number;
};

type TransactionListResponse = {
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
    records?: unknown[];
};

const PAGE_SIZES = [25, 50, 100, 200] as const;
const STATUS_ALL = "all";
const STATUS_CREATED = "Created";
const STATUS_SUCCEEDED = "Succeeded";
const STATUS_FAILED = "Failed";
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: STATUS_ALL, label: "Tất cả trạng thái" },
    { value: STATUS_CREATED, label: "Được tạo" },
    { value: STATUS_SUCCEEDED, label: "Thành công" },
    { value: STATUS_FAILED, label: "Thất bại" },
];

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function PageAdminFinanceTransactions() {
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>(STATUS_ALL);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchTransactions = useCallback(
        async (showRefreshing: boolean) => {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const query: { status?: PaymentIntentStatus; page?: number; pageSize?: number } = {
                    page,
                    pageSize,
                    ...(statusFilter === STATUS_ALL ? {} : { status: statusFilter as PaymentIntentStatus }),
                };

                const response = await client.get<TransactionListResponse>({
                    url: "/api/admin/system/transactions",
                    query: query as Record<string, unknown>,
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải danh sách giao dịch.");
                }

                const data = response.data as TransactionListResponse;
                setTransactions(normalizeTransactions(data.records));
                setTotalRecords(Number(data.totalRecords ?? 0));
                setTotalPages(Number(data.totalPages ?? 0));
                setError(null);
            } catch (e) {
                console.error("Không thể tải danh sách giao dịch", e);
                setTransactions([]);
                setTotalRecords(0);
                setTotalPages(0);
                setError(e instanceof Error ? e.message : "Không thể tải danh sách giao dịch.");
                if (showRefreshing) {
                    toast.error("Làm mới danh sách giao dịch thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, pageSize, statusFilter],
    );

    useEffect(() => {
        void fetchTransactions(false);
    }, [fetchTransactions]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, statusFilter]);

    const counts = useMemo(
        () => ({
            created: transactions.filter((t) => t.status === STATUS_CREATED).length,
            succeeded: transactions.filter((t) => t.status === STATUS_SUCCEEDED).length,
            failed: transactions.filter((t) => t.status === STATUS_FAILED).length,
        }),
        [transactions],
    );

    const totalAmount = useMemo(
        () => transactions.filter((t) => t.status === STATUS_SUCCEEDED).reduce((sum, t) => sum + t.amount, 0),
        [transactions],
    );

    const canGoPrev = page > 1;
    const canGoNext = totalPages > 0 && page < totalPages;

    return (
        <>
            <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Lịch sử giao dịch</h1>
                        <Badge variant="outline">Trang {page} / {Math.max(totalPages, 1)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi tất cả giao dịch thanh toán trên hệ thống, bao gồm trạng thái và hoàn tiền.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => void fetchTransactions(true)} disabled={loading || refreshing}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                        Làm mới
                    </Button>
                </div>
            </div>

            <Tabs orientation="horizontal" defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="transactions">Danh sách giao dịch</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tổng số giao dịch</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <>
                                        <Skeleton className="mb-2 h-8 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{numberFormatter.format(totalRecords)}</div>
                                        <p className="text-xs text-muted-foreground">Tất cả giao dịch</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Thành công</CardTitle>
                                <Wallet className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <>
                                        <Skeleton className="mb-2 h-8 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{numberFormatter.format(counts.succeeded)}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {currencyFormatter.format(totalAmount)}
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
                                <TrendingUp className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <>
                                        <Skeleton className="mb-2 h-8 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{numberFormatter.format(counts.created)}</div>
                                        <p className="text-xs text-muted-foreground">Giao dịch</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
                                <DollarSign className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <>
                                        <Skeleton className="mb-2 h-8 w-20" />
                                        <Skeleton className="h-4 w-32" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">{numberFormatter.format(counts.failed)}</div>
                                        <p className="text-xs text-muted-foreground">Giao dịch</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách giao dịch</CardTitle>
                            <CardDescription>
                                Hiển thị {transactions.length} / {numberFormatter.format(totalRecords)} bản ghi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative w-full sm:w-96">
                                    <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Tìm email, liên hệ..." className="pl-8" disabled />
                                </div>

                                <div className="flex gap-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <select
                                        value={pageSize}
                                        onChange={(event) => setPageSize(Number(event.target.value))}
                                        className="h-10 rounded-md border bg-background px-3 text-sm"
                                    >
                                        {PAGE_SIZES.map((size) => (
                                            <option key={size} value={size}>
                                                {size} bản ghi
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {error ? (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                                    {error}
                                </div>
                            ) : null}

                            <div className="overflow-hidden rounded-md border">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="h-11 px-3 text-left font-medium text-muted-foreground">
                                                    Mã giao dịch
                                                </th>
                                                <th className="h-11 px-3 text-left font-medium text-muted-foreground">
                                                    Người dùng / Liên hệ
                                                </th>
                                                <th className="h-11 px-3 text-left font-medium text-muted-foreground">
                                                    Nhà xe
                                                </th>
                                                <th className="h-11 px-3 text-right font-medium text-muted-foreground">
                                                    Số tiền
                                                </th>
                                                <th className="h-11 px-3 text-left font-medium text-muted-foreground">
                                                    Phương thức
                                                </th>
                                                <th className="h-11 px-3 text-left font-medium text-muted-foreground">
                                                    Trạng thái
                                                </th>
                                                <th className="h-11 px-3 text-left font-medium text-muted-foreground">
                                                    Ngày tạo
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading
                                                ? Array.from({ length: 6 }).map((_, index) => (
                                                      <tr key={index} className="border-b">
                                                          {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                              <td key={cellIndex} className="px-3 py-3">
                                                                  <Skeleton className="h-6 w-full" />
                                                              </td>
                                                          ))}
                                                      </tr>
                                                  ))
                                                : null}

                                            {!loading && transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="h-24 px-3 text-center text-muted-foreground">
                                                        Không có giao dịch nào.
                                                    </td>
                                                </tr>
                                            ) : null}

                                            {!loading
                                                ? transactions.map((txn) => (
                                                      <tr
                                                          key={txn.id}
                                                          className="border-b align-top transition-colors hover:bg-muted/30"
                                                      >
                                                          <td className="px-3 py-3 font-mono text-xs">
                                                              {txn.id.substring(0, 8).toUpperCase()}...
                                                          </td>
                                                          <td className="px-3 py-3">
                                                              <div className="font-medium">{txn.user?.fullName || txn.booking?.contactName || "N/A"}</div>
                                                              <div className="text-xs text-muted-foreground">
                                                                  {txn.user?.email || txn.booking?.contactEmail || ""}
                                                              </div>
                                                          </td>
                                                          <td className="px-3 py-3">
                                                              <div>{txn.company?.companyName || "N/A"}</div>
                                                          </td>
                                                          <td className="px-3 py-3 text-right">
                                                              <div className="font-medium">{currencyFormatter.format(txn.amount)}</div>
                                                              {txn.refundCount > 0 ? (
                                                                  <div className="text-xs text-orange-600">
                                                                      Hoàn: {currencyFormatter.format(txn.refundAmount)}
                                                                  </div>
                                                              ) : null}
                                                          </td>
                                                          <td className="px-3 py-3">
                                                              <Badge variant="outline">
                                                                  {txn.provider === "Momo"
                                                                      ? "Momo"
                                                                      : txn.provider === "Stripe"
                                                                        ? "Stripe"
                                                                        : "Tiền mặt"}
                                                              </Badge>
                                                          </td>
                                                          <td className="px-3 py-3">
                                                              <StatusBadge status={txn.status} />
                                                          </td>
                                                          <td className="px-3 py-3 text-muted-foreground">
                                                              {formatDateTime(txn.createdAt)}
                                                          </td>
                                                      </tr>
                                                  ))
                                                : null}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Hiển thị {transactions.length} / {numberFormatter.format(totalRecords)} bản ghi
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((current) => current - 1)}
                                        disabled={!canGoPrev}
                                    >
                                        Trang trước
                                    </Button>
                                    <Badge variant="outline">Trang {page}</Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((current) => current + 1)}
                                        disabled={!canGoNext}
                                    >
                                        Trang sau
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}

function StatusBadge({ status }: { status: PaymentIntentStatus }) {
    if (status === STATUS_CREATED) {
        return <Badge variant="secondary">Được tạo</Badge>;
    }

    if (status === STATUS_SUCCEEDED) {
        return <Badge>Thành công</Badge>;
    }

    return <Badge variant="destructive">Thất bại</Badge>;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return "N/A";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function normalizeTransactions(records: unknown[] | undefined): TransactionItem[] {
    if (!Array.isArray(records)) {
        return [];
    }

    return records
        .map((item) => {
            if (!isObject(item)) {
                return null;
            }

            const id = pickString(item, ["intentID", "intentId", "id"]);
            if (!id) {
                return null;
            }

            const statusValue = pickStatus(item, ["status", "Status"]);
            const bookingObj = pickValue(item, ["booking", "Booking"]);
            const companyObj = pickValue(item, ["company", "Company"]);
            const userObj = bookingObj ? pickValue(bookingObj, ["user", "User"]) : null;

            return {
                id: pickString(item, ["intentID", "IntentID", "intentId", "id"]) || "",
                bookingId: pickString(item, ["bookingID", "BookingID", "bookingId"]) || "",
                provider: pickString(item, ["provider", "Provider"]) || "Unknown",
                amount: pickNumber(item, ["amount", "Amount"]) || 0,
                currency: pickString(item, ["currency", "Currency"]) || "VND",
                status: statusValue || STATUS_CREATED,
                createdAt: pickString(item, ["createdAt", "CreatedAt"]),
                booking: bookingObj
                    ? {
                          id: pickString(bookingObj, ["bookingID", "BookingID", "bookingId", "id"]) || "",
                          contactName: pickString(bookingObj, ["contactName", "ContactName"]) || "",
                          contactEmail: pickString(bookingObj, ["contactEmail", "ContactEmail"]) || "",
                          contactPhone: pickString(bookingObj, ["contactPhone", "ContactPhone"]) || "",
                          totalAmount: pickNumber(bookingObj, ["totalAmount", "TotalAmount"]) || 0,
                          status: pickString(bookingObj, ["status", "Status"]) || "",
                      }
                    : null,
                user: userObj
                    ? {
                          id: pickString(userObj, ["userID", "UserID", "userId", "id"]) || "",
                          email: pickString(userObj, ["email", "Email"]) || "",
                          fullName: pickString(userObj, ["fullName", "FullName"]) || "",
                      }
                    : null,
                company: companyObj
                    ? {
                          id: pickString(companyObj, ["companyID", "CompanyID", "companyId", "id"]) || "",
                          companyName: pickString(companyObj, ["companyName", "CompanyName", "name", "Name"]) || "",
                      }
                    : null,
                refundCount: pickNumber(item, ["refundCount", "RefundCount"]) || 0,
                refundAmount: pickNumber(item, ["refundAmount", "RefundAmount"]) || 0,
            } satisfies TransactionItem;
        })
        .filter((item): item is TransactionItem => Boolean(item));
}

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return null;
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "number") {
            return value;
        }
    }

    return null;
}

function pickValue(source: Record<string, unknown>, keys: string[]): Record<string, unknown> | null {
    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (isObject(value)) {
            return value;
        }
    }

    return null;
}

function pickStatus(source: Record<string, unknown>, keys: string[]): PaymentIntentStatus | null {
    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "string" && [STATUS_CREATED, STATUS_SUCCEEDED, STATUS_FAILED].includes(value)) {
            return value as PaymentIntentStatus;
        }
    }

    return null;
}

function readDeepValue(source: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = source;

    for (const part of parts) {
        if (!isObject(current)) {
            return undefined;
        }

        current = current[part];
    }

    return current;
}
