import {
    getApiAdminSystemCompanies,
    getApiAdminSystemCompaniesByCompanyIdBuses,
    getApiAdminSystemCompaniesByCompanyIdProfile,
    getApiAdminSystemCompaniesByCompanyIdTickets,
    getApiAdminSystemCompaniesByCompanyIdTrips,
} from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Building2, Bus, CalendarRange, RefreshCw, Search, Ticket } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CompanyItem = {
    id: string;
    name: string;
    licenseNumber: string | null;
    hotline: string | null;
    isApproved: boolean;
};

type CompanyListResponse = {
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
    records?: unknown[];
};

type DetailsState = {
    profile: Record<string, unknown> | null;
    buses: Array<Record<string, unknown>>;
    trips: Array<Record<string, unknown>>;
    tickets: Array<Record<string, unknown>>;
};

const PAGE_SIZES = [25, 50, 100, 200] as const;

export function PageAdminPartnerCompanies() {
    const [companies, setCompanies] = useState<CompanyItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(25);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
    const [details, setDetails] = useState<DetailsState>({ profile: null, buses: [], trips: [], tickets: [] });

    const fetchCompanies = useCallback(
        async (showRefreshing: boolean) => {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const response = await getApiAdminSystemCompanies({
                    query: {
                        ...(search.trim() ? { q: search.trim() } : {}),
                        page,
                        pageSize,
                    } as Record<string, unknown>,
                });

                if (response.error || !response.data) {
                    throw new Error(getApiErrorMessage(response.error, "Khong the tai danh sach doi tac."));
                }

                const data = response.data as CompanyListResponse;
                setCompanies(normalizeCompanies(data.records));
                setTotalRecords(Number(data.totalRecords ?? 0));
                setTotalPages(Number(data.totalPages ?? 0));
                setError(null);
            } catch (e) {
                console.error("Khong the tai danh sach doi tac", e);
                setCompanies([]);
                setTotalRecords(0);
                setTotalPages(0);
                setError(e instanceof Error ? e.message : "Khong the tai danh sach doi tac.");
                if (showRefreshing) {
                    toast.error("Lam moi danh sach doi tac that bai");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, pageSize, search],
    );

    useEffect(() => {
        void fetchCompanies(false);
    }, [fetchCompanies]);

    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    const approvedCount = useMemo(() => companies.filter((company) => company.isApproved).length, [companies]);
    const pendingCount = useMemo(() => companies.filter((company) => !company.isApproved).length, [companies]);

    const openDetails = async (company: CompanyItem) => {
        setSelectedCompany(company);
        setDetailsOpen(true);
        setDetailsLoading(true);

        try {
            const [profileResponse, busesResponse, tripsResponse, ticketsResponse] = await Promise.all([
                getApiAdminSystemCompaniesByCompanyIdProfile({ path: { companyId: company.id } }),
                getApiAdminSystemCompaniesByCompanyIdBuses({ path: { companyId: company.id } }),
                getApiAdminSystemCompaniesByCompanyIdTrips({
                    path: { companyId: company.id },
                    query: { page: 1, pageSize: 25 } as Record<string, unknown>,
                }),
                getApiAdminSystemCompaniesByCompanyIdTickets({
                    path: { companyId: company.id },
                    query: { page: 1, pageSize: 25 } as Record<string, unknown>,
                }),
            ]);

            if (profileResponse.error) {
                throw new Error(getApiErrorMessage(profileResponse.error, "Khong the tai profile doi tac."));
            }
            if (busesResponse.error) {
                throw new Error(getApiErrorMessage(busesResponse.error, "Khong the tai danh sach xe."));
            }
            if (tripsResponse.error) {
                throw new Error(getApiErrorMessage(tripsResponse.error, "Khong the tai danh sach chuyen."));
            }
            if (ticketsResponse.error) {
                throw new Error(getApiErrorMessage(ticketsResponse.error, "Khong the tai danh sach ve."));
            }

            setDetails({
                profile: isObject(profileResponse.data) ? (profileResponse.data as Record<string, unknown>) : null,
                buses: normalizeRecords(busesResponse.data),
                trips: normalizeRecords(tripsResponse.data),
                tickets: normalizeRecords(ticketsResponse.data),
            });
        } catch (e) {
            console.error("Khong the tai chi tiet doi tac", e);
            toast.error(e instanceof Error ? e.message : "Khong the tai chi tiet doi tac.");
            setDetails({ profile: null, buses: [], trips: [], tickets: [] });
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setDetailsOpen(false);
        setSelectedCompany(null);
        setDetails({ profile: null, buses: [], trips: [], tickets: [] });
    };

    const canGoPrev = page > 1;
    const canGoNext = totalPages > 0 && page < totalPages;

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Danh sach cong ty doi tac</h1>
                        <Badge variant="outline">Trang {page} / {Math.max(totalPages, 1)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Xem cong ty, thong tin co ban va thong ke nhanh ve xe / chuyen / ve.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-64 max-w-full">
                        <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Tim theo ten, giay phep"
                            className="pl-8"
                        />
                    </div>

                    <select
                        value={pageSize}
                        onChange={(event) => {
                            setPageSize(Number(event.target.value));
                            setPage(1);
                        }}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size} ban ghi
                            </option>
                        ))}
                    </select>

                    <Button variant="outline" onClick={() => void fetchCompanies(true)} disabled={loading || refreshing}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                        Lam moi
                    </Button>
                </div>
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-3">
                <SummaryCard title="Tong cong ty" value={companies.length} icon={<Building2 className="h-4 w-4" />} loading={loading} />
                <SummaryCard title="Da duyet" value={approvedCount} icon={<Bus className="h-4 w-4" />} loading={loading} />
                <SummaryCard title="Chua duyet" value={pendingCount} icon={<CalendarRange className="h-4 w-4" />} loading={loading} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bang cong ty doi tac</CardTitle>
                    <CardDescription>
                        Hien thi {companies.length} / {new Intl.NumberFormat("vi-VN").format(totalRecords)} ban ghi.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Cong ty</th>
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Giay phep</th>
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Hotline</th>
                                        <th className="h-11 px-3 text-left font-medium text-muted-foreground">Trang thai</th>
                                        <th className="h-11 px-3 text-right font-medium text-muted-foreground">Thao tac</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 6 }).map((_, index) => (
                                              <tr key={index} className="border-b">
                                                  {Array.from({ length: 5 }).map((__, cellIndex) => (
                                                      <td key={cellIndex} className="px-3 py-3">
                                                          <Skeleton className="h-6 w-full" />
                                                      </td>
                                                  ))}
                                              </tr>
                                          ))
                                        : null}

                                    {!loading && companies.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="h-24 px-3 text-center text-muted-foreground">
                                                Khong tim thay cong ty phu hop.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!loading
                                        ? companies.map((company) => (
                                              <tr key={company.id} className="border-b align-top transition-colors hover:bg-muted/30">
                                                  <td className="px-3 py-3 font-medium">{company.name}</td>
                                                  <td className="px-3 py-3 text-muted-foreground">{company.licenseNumber || "Chua co"}</td>
                                                  <td className="px-3 py-3 text-muted-foreground">{company.hotline || "Chua co"}</td>
                                                  <td className="px-3 py-3">
                                                      <Badge variant={company.isApproved ? "default" : "secondary"}>
                                                          {company.isApproved ? "Da duyet" : "Chua duyet"}
                                                      </Badge>
                                                  </td>
                                                  <td className="px-3 py-3 text-right">
                                                      <Button variant="outline" size="sm" onClick={() => void openDetails(company)}>
                                                          Xem chi tiet
                                                      </Button>
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
                            Hien thi {companies.length} / {new Intl.NumberFormat("vi-VN").format(totalRecords)} ban ghi
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={!canGoPrev}>
                                Trang truoc
                            </Button>
                            <Badge variant="outline">Trang {page}</Badge>
                            <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!canGoNext}>
                                Trang sau
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={detailsOpen} onOpenChange={(open) => (!open ? closeDetails() : setDetailsOpen(true))}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedCompany?.name || "Chi tiet cong ty"}</DialogTitle>
                        <DialogDescription>Thong tin profile, danh sach xe, chuyen va ve.</DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Thong tin cong ty</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                                    <InfoField label="Ten" value={pickString(details.profile, ["name"]) || selectedCompany?.name || "Chua co"} />
                                    <InfoField label="Ma cong ty" value={pickString(details.profile, ["companyID", "companyId"]) || selectedCompany?.id || "Chua co"} />
                                    <InfoField label="Giay phep" value={pickString(details.profile, ["licenseNumber"]) || "Chua co"} />
                                    <InfoField label="Hotline" value={pickString(details.profile, ["hotline"]) || "Chua co"} />
                                </CardContent>
                            </Card>

                            <div className="grid gap-4 md:grid-cols-3">
                                <SummaryCard title="Xe" value={details.buses.length} icon={<Bus className="h-4 w-4" />} loading={false} />
                                <SummaryCard title="Chuyen" value={details.trips.length} icon={<CalendarRange className="h-4 w-4" />} loading={false} />
                                <SummaryCard title="Ve" value={details.tickets.length} icon={<Ticket className="h-4 w-4" />} loading={false} />
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Danh sach xe</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {details.buses.length > 0 ? (
                                        details.buses.slice(0, 5).map((bus, index) => (
                                            <div key={pickString(bus, ["busID", "id"]) || String(index)} className="rounded border px-3 py-2">
                                                <div className="font-medium">{pickString(bus, ["plateNumber"]) || "Chua co bien so"}</div>
                                                <div className="text-muted-foreground">Loai xe: {pickString(bus, ["busType", "busTypeName", "BusType.name"]) || "Chua ro"}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground">Chua co du lieu xe.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDetails}>Dong</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SummaryCard({ title, value, icon, loading }: { title: string; value: number; icon: React.ReactNode; loading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{formatNumber(value)}</div>}
            </CardContent>
        </Card>
    );
}

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span className="text-muted-foreground">{label}: </span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function normalizeCompanies(records: unknown[] | undefined): CompanyItem[] {
    if (!Array.isArray(records)) {
        return [];
    }

    return records
        .map((item) => {
            if (!isObject(item)) {
                return null;
            }

            const id = pickString(item, ["companyID", "companyId", "id"]);
            const name = pickString(item, ["name"]);

            if (!id || !name) {
                return null;
            }

            return {
                id,
                name,
                licenseNumber: pickString(item, ["licenseNumber"]),
                hotline: pickString(item, ["hotline"]),
                isApproved: pickBoolean(item, ["isApproved"]),
            } satisfies CompanyItem;
        })
        .filter((item): item is CompanyItem => Boolean(item));
}

function normalizeRecords(value: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(value)) {
        return value.filter(isObject) as Array<Record<string, unknown>>;
    }

    if (isObject(value) && Array.isArray(value.records)) {
        return value.records.filter(isObject) as Array<Record<string, unknown>>;
    }

    return [];
}

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
}

function pickString(source: Record<string, unknown> | null | undefined, keys: string[]): string | null {
    if (!source) {
        return null;
    }

    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }

    return null;
}

function pickBoolean(source: Record<string, unknown> | null | undefined, keys: string[]): boolean {
    if (!source) {
        return false;
    }

    for (const key of keys) {
        const value = readDeepValue(source, key);
        if (typeof value === "boolean") {
            return value;
        }
    }

    return false;
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

function formatNumber(value: number): string {
    return new Intl.NumberFormat("vi-VN").format(value);
}

function getApiErrorMessage(error: unknown, fallback: string): string {
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
