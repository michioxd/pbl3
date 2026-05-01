import { getApiBusadminBusesTrips, type GetApiBusadminBusesTripsData } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TripItem = {
    tripID?: string;
    departureDate?: string;
    departureTime?: string;
    arrivalTime?: string;
    status?: string;
    routeID?: string;
    routeName?: string;
    busID?: string | null;
    busPlateNumber?: string | null;
    busTypeID?: string | null;
    busTypeName?: string | null;
    ticketCount?: number;
};

type TripListResponse = {
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
    records?: unknown[];
};

export function PageBusAdminTrips() {
    const [items, setItems] = useState<TripItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [search, setSearch] = useState("");
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        void load(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, year, month]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, year, month]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return items;
        return items.filter((item) =>
            [item.routeName, item.busPlateNumber, item.status, item.departureDate].some((value) =>
                String(value ?? "").toLowerCase().includes(query),
            ),
        );
    }, [items, search]);

    async function load(showRefreshing: boolean) {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const query = { page, pageSize } as unknown as GetApiBusadminBusesTripsData["query"] & {
                page: number;
                pageSize: number;
            };
            const yearValue = Number(year);
            const monthValue = Number(month);

            if (!Number.isNaN(yearValue) && !Number.isNaN(monthValue)) {
                query.year = yearValue;
                query.month = monthValue;
            }

            const response = await getApiBusadminBusesTrips({
                query: query as never,
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải danh sách chuyến xe.");
            }

            const data = response.data as TripListResponse;
            setItems(normalizeRecords(data.records));
            setTotalRecords(Number(data.totalRecords ?? 0));
            setTotalPages(Number(data.totalPages ?? 0));
            setError(null);
        } catch (e) {
            setItems([]);
            setTotalRecords(0);
            setTotalPages(0);
            setError(e instanceof Error ? e.message : "Không thể tải danh sách chuyến xe.");
            if (showRefreshing) toast.error("Làm mới danh sách chuyến xe thất bại");
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
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý chuyến</h1>
                        <Badge variant="outline">{totalRecords} chuyến</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Lọc theo tháng, tìm chuyến và kiểm tra trạng thái vận hành.</p>
                </div>
                <Button variant="outline" onClick={() => void load(true)} disabled={loading || refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bộ lọc</CardTitle>
                    <CardDescription>Lấy dữ liệu theo tháng và năm hiện tại của nhà xe.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-4">
                        <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Năm" inputMode="numeric" />
                        <Input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="Tháng" inputMode="numeric" />
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Tìm theo tuyến, biển số, trạng thái..." />
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                  <Skeleton className="h-6 w-40" />
                                  <Skeleton className="h-4 w-60" />
                              </CardHeader>
                              <CardContent className="space-y-3">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-5/6" />
                                  <Skeleton className="h-4 w-2/3" />
                              </CardContent>
                          </Card>
                      ))
                    : filteredItems.map((item) => (
                          <Card key={item.tripID ?? `${item.routeName}-${item.departureDate}-${item.departureTime}`}>
                              <CardHeader>
                                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                      <div>
                                          <CardTitle className="text-base">{item.routeName || "Chuyến không tên"}</CardTitle>
                                          <CardDescription>
                                              {item.departureDate || "-"} | {item.departureTime || "-"} - {item.arrivalTime || "-"}
                                          </CardDescription>
                                      </div>
                                      <Badge variant="outline">{item.status || "Unknown"}</Badge>
                                  </div>
                              </CardHeader>
                              <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                                  <Meta label="Xe" value={item.busPlateNumber || "Chưa gán"} />
                                  <Meta label="Loại xe" value={item.busTypeName || "-"} />
                                  <Meta label="Mã chuyến" value={item.tripID || "-"} />
                                  <Meta label="Số vé" value={String(item.ticketCount ?? 0)} />
                              </CardContent>
                          </Card>
                      ))}
            </div>

            {!loading && filteredItems.length === 0 ? (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Chưa có chuyến</CardTitle>
                        <CardDescription>Không có chuyến nào khớp bộ lọc hiện tại.</CardDescription>
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

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
            <div className="mt-1 font-medium text-foreground">{value}</div>
        </div>
    );
}

function normalizeRecords(records: unknown[] | undefined): TripItem[] {
    if (!Array.isArray(records)) return [];
    return records.map((record) => {
        if (!isRecord(record)) return {};

        return {
            tripID: pickString(record.tripID),
            departureDate: pickString(record.departureDate),
            departureTime: pickString(record.departureTime),
            arrivalTime: pickString(record.arrivalTime),
            status: pickString(record.status),
            routeID: pickString(record.routeID),
            routeName: pickString(record.routeName),
            busID: pickNullableString(record.busID),
            busPlateNumber: pickNullableString(record.busPlateNumber),
            busTypeID: pickNullableString(record.busTypeID),
            busTypeName: pickNullableString(record.busTypeName),
            ticketCount: pickNumber(record.ticketCount),
        };
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function pickString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value : undefined;
}

function pickNullableString(value: unknown): string | null | undefined {
    if (typeof value === "string") return value.trim() || null;
    if (value === null) return null;
    return undefined;
}

function pickNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
}