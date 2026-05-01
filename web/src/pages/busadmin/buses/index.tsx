import { getApiBusadminBusesCompany } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BusItem = {
    busID?: string;
    plateNumber?: string;
    isActive?: boolean;
    busType?: {
        busTypeID?: string;
        name?: string;
        totalSeats?: number;
        amenities?: string | null;
    };
};

type BusListResponse = {
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
    records?: unknown[];
};

export function PageBusAdminBuses() {
    const [items, setItems] = useState<BusItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [search, setSearch] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        void load(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return items;
        return items.filter((item) =>
            [item.plateNumber, item.busType?.name, item.busType?.busTypeID].some((value) =>
                String(value ?? "").toLowerCase().includes(query),
            ),
        );
    }, [items, search]);

    async function load(showRefreshing: boolean) {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await getApiBusadminBusesCompany({
                query: { page, pageSize } as never,
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải danh sách xe.");
            }

            const data = response.data as BusListResponse;
            setItems(normalizeRecords(data.records));
            setTotalRecords(Number(data.totalRecords ?? 0));
            setTotalPages(Number(data.totalPages ?? 0));
            setError(null);
        } catch (e) {
            setItems([]);
            setTotalRecords(0);
            setTotalPages(0);
            setError(e instanceof Error ? e.message : "Không thể tải danh sách xe.");
            if (showRefreshing) toast.error("Làm mới danh sách xe thất bại");
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
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý xe</h1>
                        <Badge variant="outline">{totalRecords} xe</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Danh sách xe thuộc nhà xe hiện tại.</p>
                </div>
                <Button variant="outline" onClick={() => void load(true)} disabled={loading || refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tìm kiếm nhanh</CardTitle>
                    <CardDescription>Lọc theo biển số hoặc loại xe.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Tìm xe..." />
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

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading
                    ? Array.from({ length: 6 }, (_, index) => (
                          <Card key={index}>
                              <CardHeader>
                                  <Skeleton className="h-6 w-40" />
                                  <Skeleton className="h-4 w-52" />
                              </CardHeader>
                              <CardContent className="space-y-3">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-5/6" />
                              </CardContent>
                          </Card>
                      ))
                    : filteredItems.map((item) => (
                          <Card key={item.busID ?? item.plateNumber}>
                              <CardHeader>
                                  <div className="flex items-center justify-between gap-3">
                                      <CardTitle className="text-base">{item.plateNumber || "-"}</CardTitle>
                                      <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Đang chạy" : "Tạm dừng"}</Badge>
                                  </div>
                                  <CardDescription>{item.busType?.name || "Loại xe chưa xác định"}</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm text-muted-foreground">
                                  <div>Số ghế: {item.busType?.totalSeats ?? "-"}</div>
                                  <div className="line-clamp-3">Tiện ích: {item.busType?.amenities || "-"}</div>
                              </CardContent>
                          </Card>
                      ))}
            </div>

            {!loading && filteredItems.length === 0 ? (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Chưa có xe</CardTitle>
                        <CardDescription>Nhà xe hiện tại chưa có xe nào khớp điều kiện tìm kiếm.</CardDescription>
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

function normalizeRecords(records: unknown[] | undefined): BusItem[] {
    if (!Array.isArray(records)) return [];
    return records.map((record) => {
        if (!isRecord(record)) return {};

        return {
            busID: pickString(record.busID),
            plateNumber: pickString(record.plateNumber),
            isActive: pickBoolean(record.isActive),
            busType: isRecord(record.busType)
                ? {
                      busTypeID: pickString(record.busType.busTypeID),
                      name: pickString(record.busType.name),
                      totalSeats: pickNumber(record.busType.totalSeats),
                      amenities: pickNullableString(record.busType.amenities),
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

function pickNullableString(value: unknown): string | null | undefined {
    if (typeof value === "string") return value.trim() || null;
    if (value === null) return null;
    return undefined;
}

function pickBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function pickNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
}