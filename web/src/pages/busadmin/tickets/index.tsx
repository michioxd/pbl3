import { getApiBusadminBusesTickets, type GetApiBusadminBusesTicketsData, type TicketStatus } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TicketItem = {
    ticketID?: string;
    ticketCode?: string;
    finalPrice?: number;
    status?: TicketStatus;
    bookingTime?: string;
    passenger?: {
        passengerID?: string;
        fullName?: string;
        phoneNumber?: string;
        email?: string;
    };
    trip?: {
        tripID?: string;
        departureDate?: string;
        departureTime?: string;
        arrivalTime?: string;
        routeName?: string;
    };
    seat?: {
        layoutID?: string;
        seatLabel?: string;
        floor?: number;
    };
};

type TicketListResponse = {
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
    records?: unknown[];
};

const STATUS_ALL = "all";

export function PageBusAdminTickets() {
    const [items, setItems] = useState<TicketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>(STATUS_ALL);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        void load(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, statusFilter]);

    const summary = useMemo(
        () => ({
            total: items.length,
            success: items.filter((item) => item.status !== 2).length,
            cancelled: items.filter((item) => item.status === 2).length,
        }),
        [items],
    );

    async function load(showRefreshing: boolean) {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const query = { page, pageSize } as unknown as GetApiBusadminBusesTicketsData["query"] & {
                page: number;
                pageSize: number;
            };
            if (statusFilter !== STATUS_ALL) {
                query.status = Number(statusFilter) as TicketStatus;
            }

            const response = await getApiBusadminBusesTickets({
                query: query as never,
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải danh sách vé.");
            }

            const data = response.data as TicketListResponse;
            setItems(normalizeRecords(data.records));
            setTotalRecords(Number(data.totalRecords ?? 0));
            setTotalPages(Number(data.totalPages ?? 0));
            setError(null);
        } catch (e) {
            setItems([]);
            setTotalRecords(0);
            setTotalPages(0);
            setError(e instanceof Error ? e.message : "Không thể tải danh sách vé.");
            if (showRefreshing) toast.error("Làm mới danh sách vé thất bại");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý vé</h1>
                        <Badge variant="outline">{totalRecords} vé</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Theo dõi vé theo trạng thái và lịch sử đặt chỗ.</p>
                </div>
                <Button variant="outline" onClick={() => void load(true)} disabled={loading || refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bộ lọc</CardTitle>
                    <CardDescription>Chọn trạng thái vé để xem chi tiết.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="max-w-sm">
                            <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={STATUS_ALL}>Tất cả</SelectItem>
                            <SelectItem value="0">Đã tạo</SelectItem>
                            <SelectItem value="1">Đã soát vé</SelectItem>
                            <SelectItem value="2">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <StatCard title="Tổng vé hiển thị" value={summary.total} />
                <StatCard title="Không hủy" value={summary.success} />
                <StatCard title="Đã hủy" value={summary.cancelled} />
            </div>

            {error ? (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Không thể tải dữ liệu</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => void load(true)}>Thử lại</Button>
                    </CardContent>
                </Card>
            ) : null}

            <div className="mt-4 grid gap-4">
                {loading
                    ? Array.from({ length: 6 }, (_, index) => (
                          <Card key={index}>
                              <CardHeader>
                                  <Skeleton className="h-6 w-44" />
                                  <Skeleton className="h-4 w-64" />
                              </CardHeader>
                              <CardContent className="space-y-3">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-5/6" />
                              </CardContent>
                          </Card>
                      ))
                    : items.map((item) => (
                          <Card key={item.ticketID ?? item.ticketCode}>
                              <CardHeader>
                                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                      <div>
                                          <CardTitle className="text-base">{item.ticketCode || "Vé chưa có mã"}</CardTitle>
                                          <CardDescription>
                                              {item.trip?.routeName || "-"} | {item.bookingTime || "-"}
                                          </CardDescription>
                                      </div>
                                      <Badge variant="outline">{formatStatusLabel(item.status)}</Badge>
                                  </div>
                              </CardHeader>
                              <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                                  <Meta label="Hành khách" value={item.passenger?.fullName || "-"} />
                                  <Meta label="Điện thoại" value={item.passenger?.phoneNumber || "-"} />
                                  <Meta label="Giá vé" value={formatCurrency(item.finalPrice ?? 0)} />
                                  <Meta label="Ghế" value={item.seat?.seatLabel || "-"} />
                              </CardContent>
                          </Card>
                      ))}
            </div>

            {!loading && items.length === 0 ? (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Chưa có vé</CardTitle>
                        <CardDescription>Không có vé nào khớp bộ lọc hiện tại.</CardDescription>
                    </CardHeader>
                </Card>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                    Trang {page} / {Math.max(totalPages, 1)}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                        Trước
                    </Button>
                    <Button variant="outline" disabled={totalPages > 0 ? page >= totalPages : loading} onClick={() => setPage((value) => value + 1)}>
                        Sau
                    </Button>
                </div>
            </div>
        </>
    );
}

function StatCard({ title, value }: { title: string; value: number }) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
        </Card>
    );
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
            <div className="mt-1 font-medium text-foreground">{value}</div>
        </div>
    );
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

function normalizeRecords(records: unknown[] | undefined): TicketItem[] {
    if (!Array.isArray(records)) return [];
    return records.map((record) => {
        if (!isRecord(record)) return {};

        return {
            ticketID: pickString(record.ticketID),
            ticketCode: pickString(record.ticketCode),
            finalPrice: pickNumber(record.finalPrice),
            status: pickString(record.status) as TicketStatus | undefined,
            bookingTime: pickString(record.bookingTime),
            passenger: isRecord(record.passenger)
                ? {
                      passengerID: pickString(record.passenger.passengerID),
                      fullName: pickString(record.passenger.fullName),
                      phoneNumber: pickString(record.passenger.phoneNumber),
                      email: pickString(record.passenger.email),
                  }
                : undefined,
            trip: isRecord(record.trip)
                ? {
                      tripID: pickString(record.trip.tripID),
                      departureDate: pickString(record.trip.departureDate),
                      departureTime: pickString(record.trip.departureTime),
                      arrivalTime: pickString(record.trip.arrivalTime),
                      routeName: pickString(record.trip.routeName),
                  }
                : undefined,
            seat: isRecord(record.seat)
                ? {
                      layoutID: pickString(record.seat.layoutID),
                      seatLabel: pickString(record.seat.seatLabel),
                      floor: pickNumber(record.seat.floor),
                  }
                : undefined,
        };
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function pickString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value : undefined;
}

function pickNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
}

function formatStatusLabel(status?: TicketStatus) {
    if (status === 0) return "Đã tạo";
    if (status === 1) return "Đã soát vé";
    if (status === 2) return "Đã hủy";
    return "Unknown";
}