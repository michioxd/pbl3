import {
    getApiBusadminBusesCompanyProfile,
    getApiBusadminBusesStatsMonthly,
    postApiBusadminAddBusCompany,
    type InforBusCompany,
} from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/stores";
import { BarChart3, CalendarDays, Coins, Ticket } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BusCompanyProfile = {
    companyID?: string;
    name?: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    isApproved?: boolean;
};

type CompanyFormState = {
    name: string;
    licenseNumber: string;
    hotline: string;
};

type BusMonthlyStats = {
    year?: number;
    month?: number;
    totalTickets?: number;
    soldTickets?: number;
    cancelledTickets?: number;
    checkedInTickets?: number;
    cancellationRatePercent?: number;
    grossRevenue?: number;
    averageTicketPrice?: number;
    totalTrips?: number;
    averageSoldTicketsPerTrip?: number;
    topRoutes?: Array<{ routeName?: string; ticketsSold?: number; revenue?: number }>;
    dailyStats?: Array<{ date?: string; totalTickets?: number; soldTickets?: number; cancelledTickets?: number; revenue?: number }>;
};

const initialFormState: CompanyFormState = {
    name: "",
    licenseNumber: "",
    hotline: "",
};

const PageBusAdminHome = () => {
    const store = useStore();
    const [company, setCompany] = useState<BusCompanyProfile | null>(null);
    const [stats, setStats] = useState<BusMonthlyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<CompanyFormState>(initialFormState);

    const companyReady = useMemo(() => !!company?.companyID, [company]);

    useEffect(() => {
        let active = true;

        const loadCompany = async () => {
            setIsLoading(true);
            setError(null);

            const response = await getApiBusadminBusesCompanyProfile();

            if (!active) return;

            if (response.error || !response.data) {
                setCompany(null);
                setIsLoading(false);
                return;
            }

            setCompany(normalizeCompanyProfile(response.data));

            const now = new Date();
            const statsResponse = await getApiBusadminBusesStatsMonthly({
                query: { year: now.getFullYear(), month: now.getMonth() + 1 },
            });

            if (!active) return;

            if (!statsResponse.error && statsResponse.data) {
                setStats(normalizeMonthlyStats(statsResponse.data));
            } else {
                setStats(null);
            }

            setIsLoading(false);
        };

        void loadCompany().catch((loadError: unknown) => {
            if (!active) return;
            setCompany(null);
            setIsLoading(false);
            setError(getErrorMessage(loadError, "Không thể tải thông tin nhà xe."));
        });

        return () => {
            active = false;
        };
    }, []);

    const handleChange = (field: keyof CompanyFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = form.name.trim();
        if (!name) {
            toast.error("Vui lòng nhập tên nhà xe.");
            return;
        }

        const payload: InforBusCompany = {
            name,
            licenseNumber: normalizeOptionalText(form.licenseNumber),
            hotline: normalizeOptionalText(form.hotline),
        };

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await postApiBusadminAddBusCompany({ body: payload });
            if (response.error) {
                throw new Error(getErrorMessage(response.error, "Không thể tạo nhà xe."));
            }

            toast.success("Đã tạo nhà xe thành công.");
            setForm(initialFormState);

            const refreshResponse = await getApiBusadminBusesCompanyProfile();
            if (refreshResponse.error || !refreshResponse.data) {
                setCompany(null);
                return;
            }

            setCompany(normalizeCompanyProfile(refreshResponse.data));
        } catch (submitError) {
            setError(getErrorMessage(submitError, "Không thể tạo nhà xe."));
            toast.error("Không thể tạo nhà xe.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#ffffff_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <header className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <Badge className="w-fit bg-amber-500 px-3 py-1 text-white hover:bg-amber-500">BusAdmin</Badge>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    {companyReady ? "Quản lý nhà xe" : "Thiết lập nhà xe"}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                    {companyReady
                                        ? "Nhà xe đã được liên kết với tài khoản của bạn. Bạn có thể tiếp tục quản lý xe, chuyến đi và vé ngay tại đây."
                                        : "Tài khoản BusAdmin của bạn chưa có nhà xe. Hãy tạo nhà xe trước, sau đó hệ thống mới mở toàn bộ khu quản trị."}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[22rem]">
                            <SummaryStat label="Người dùng" value={store.user.displayName} />
                            <SummaryStat label="Vai trò" value={store.user.displayRole} />
                            <SummaryStat label="Trạng thái" value={companyReady ? "Đã liên kết" : "Chờ tạo nhà xe"} />
                        </div>
                    </div>
                </header>

                {companyReady && stats ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard title="Vé trong tháng" value={formatNumber(stats.totalTickets ?? 0)} icon={Ticket} helper={`${formatNumber(stats.soldTickets ?? 0)} vé bán thành công`} />
                        <MetricCard title="Chuyến trong tháng" value={formatNumber(stats.totalTrips ?? 0)} icon={CalendarDays} helper={formatCurrency(stats.grossRevenue ?? 0)} />
                        <MetricCard title="Doanh thu" value={formatCurrency(stats.grossRevenue ?? 0)} icon={Coins} helper={`Giá vé trung bình ${formatCurrency(stats.averageTicketPrice ?? 0)}`} />
                        <MetricCard title="Tỷ lệ hủy" value={`${formatNumber(stats.cancellationRatePercent ?? 0)}%`} icon={BarChart3} helper={`Đã soát vé ${formatNumber(stats.checkedInTickets ?? 0)} lượt`} />
                    </div>
                ) : null}

                {companyReady && stats?.topRoutes?.length ? (
                    <Card className="border-white/70 bg-white/85 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
                        <CardHeader>
                            <CardTitle>Tuyến nổi bật trong tháng</CardTitle>
                            <CardDescription>Các tuyến đang tạo nhiều doanh thu nhất cho nhà xe.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {stats.topRoutes.map((route, index) => (
                                <div key={`${route.routeName}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-semibold text-slate-900">{route.routeName || "-"}</div>
                                    <div className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                                        {formatNumber(route.ticketsSold ?? 0)} vé | {formatCurrency(route.revenue ?? 0)}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : null}

                {isLoading ? (
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <LoadingCard />
                        <LoadingCard />
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <Card className="border-slate-200 bg-white/95 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
                            <CardHeader>
                                <CardTitle>{companyReady ? "Thông tin nhà xe" : "Tạo nhà xe mới"}</CardTitle>
                                <CardDescription>
                                    {companyReady
                                        ? "Dữ liệu này được lấy từ hồ sơ nhà xe hiện tại."
                                        : "Điền các thông tin cơ bản để kích hoạt workspace BusAdmin của bạn."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-slate-900">
                                {companyReady ? (
                                    <div className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <InfoBlock label="Tên nhà xe" value={company?.name || "-"} />
                                            <InfoBlock label="Mã nhà xe" value={company?.companyID || "-"} />
                                            <InfoBlock label="Số giấy phép" value={company?.licenseNumber || "Chưa có"} />
                                            <InfoBlock label="Hotline" value={company?.hotline || "Chưa có"} />
                                        </div>
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                                            Hồ sơ đã sẵn sàng. Các màn hình quản lý xe, chuyến và vé sẽ dùng company hiện tại làm ngữ cảnh.
                                        </div>
                                    </div>
                                ) : (
                                    <form className="space-y-5 text-slate-900" onSubmit={handleSubmit}>
                                        <div className="space-y-2">
                                            <Label htmlFor="company-name" className="text-slate-700">
                                                Tên nhà xe
                                            </Label>
                                            <Input
                                                id="company-name"
                                                value={form.name}
                                                onChange={handleChange("name")}
                                                className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                                                placeholder="Ví dụ: Nhà xe Hòa Bình"
                                            />
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="license-number" className="text-slate-700">
                                                    Số giấy phép
                                                </Label>
                                                <Input
                                                    id="license-number"
                                                    value={form.licenseNumber}
                                                    onChange={handleChange("licenseNumber")}
                                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                                                    placeholder="Không bắt buộc"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hotline" className="text-slate-700">
                                                    Hotline
                                                </Label>
                                                <Input
                                                    id="hotline"
                                                    value={form.hotline}
                                                    onChange={handleChange("hotline")}
                                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                                                    placeholder="Không bắt buộc"
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                                                {error}
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full rounded-2xl bg-slate-900 py-6 text-base font-semibold text-white hover:bg-slate-800"
                                        >
                                            {isSubmitting ? "Đang tạo nhà xe..." : "Tạo nhà xe"}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-white/70 bg-slate-950 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.5)]">
                            <CardHeader>
                                <CardTitle>Quy trình kích hoạt</CardTitle>
                                <CardDescription className="text-slate-300">
                                    BusAdmin chỉ được đi tiếp khi tài khoản đã gắn với một nhà xe hợp lệ.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <StepItem index="01" title="Đăng nhập BusAdmin" description="Hệ thống nhận diện role BusAdmin và mở workspace riêng." />
                                <StepItem index="02" title="Kiểm tra company" description="Nếu chưa có company, màn hình này sẽ chặn các thao tác quản trị khác." />
                                <StepItem index="03" title="Tạo company" description="Gửi tên nhà xe, giấy phép và hotline theo payload InforBusCompany." />
                                <StepItem index="04" title="Bắt đầu vận hành" description="Sau khi tạo xong, các màn hình quản lý xe và chuyến đi có thể sử dụng ngay." />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

function SummaryStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">{label}</div>
            <div className="mt-2 break-words text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function StepItem({ index, title, description }: { index: string; title: string; description: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">{index}</div>
            <div className="mt-2 text-sm font-semibold text-white">{title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
        </div>
    );
}

function LoadingCard() {
    return (
        <Card className="border-white/70 bg-white/85 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader>
                <Skeleton className="h-6 w-44" />
                <Skeleton className="mt-2 h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
            </CardContent>
        </Card>
    );
}

function MetricCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <Card className="border-white/70 bg-white/85 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{helper}</p>
            </CardContent>
        </Card>
    );
}

function normalizeCompanyProfile(data: unknown): BusCompanyProfile {
    if (!isRecord(data)) return {};

    return {
        companyID: pickString(data.companyID),
        name: pickString(data.name),
        licenseNumber: pickNullableString(data.licenseNumber),
        hotline: pickNullableString(data.hotline),
        isApproved: pickBoolean(data.isApproved),
    };
}

function normalizeMonthlyStats(data: unknown): BusMonthlyStats {
    if (!isRecord(data)) return {};

    return {
        year: pickNumber(data.Year ?? data.year),
        month: pickNumber(data.Month ?? data.month),
        totalTickets: pickNumber(data.TotalTickets ?? data.totalTickets),
        soldTickets: pickNumber(data.SoldTickets ?? data.soldTickets),
        cancelledTickets: pickNumber(data.CancelledTickets ?? data.cancelledTickets),
        checkedInTickets: pickNumber(data.CheckedInTickets ?? data.checkedInTickets),
        cancellationRatePercent: pickNumber(data.CancellationRatePercent ?? data.cancellationRatePercent),
        grossRevenue: pickNumber(data.GrossRevenue ?? data.grossRevenue),
        averageTicketPrice: pickNumber(data.AverageTicketPrice ?? data.averageTicketPrice),
        totalTrips: pickNumber(data.TotalTrips ?? data.totalTrips),
        averageSoldTicketsPerTrip: pickNumber(data.AverageSoldTicketsPerTrip ?? data.averageSoldTicketsPerTrip),
        topRoutes: normalizeRouteStats(data.TopRoutes ?? data.topRoutes),
        dailyStats: normalizeDailyStats(data.DailyStats ?? data.dailyStats),
    };
}

function normalizeRouteStats(value: unknown): Array<{ routeName?: string; ticketsSold?: number; revenue?: number }> {
    if (!Array.isArray(value)) return [];
    return value.map((item) =>
        isRecord(item)
            ? {
                  routeName: pickString(item.RouteName ?? item.routeName),
                  ticketsSold: pickNumber(item.TicketsSold ?? item.ticketsSold),
                  revenue: pickNumber(item.Revenue ?? item.revenue),
              }
            : {},
    );
}

function normalizeDailyStats(
    value: unknown,
): Array<{ date?: string; totalTickets?: number; soldTickets?: number; cancelledTickets?: number; revenue?: number }> {
    if (!Array.isArray(value)) return [];
    return value.map((item) =>
        isRecord(item)
            ? {
                  date: pickString(item.Date ?? item.date),
                  totalTickets: pickNumber(item.TotalTickets ?? item.totalTickets),
                  soldTickets: pickNumber(item.SoldTickets ?? item.soldTickets),
                  cancelledTickets: pickNumber(item.CancelledTickets ?? item.cancelledTickets),
                  revenue: pickNumber(item.Revenue ?? item.revenue),
              }
            : {},
    );
}

function normalizeOptionalText(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function pickString(value: unknown): string | undefined {
    if (typeof value === "string" && value.trim()) return value;
    return undefined;
}

function pickNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined;
}

function pickNullableString(value: unknown): string | null | undefined {
    if (typeof value === "string") return value.trim() || null;
    if (value === null) return null;
    return undefined;
}

function pickBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") return value;
    return undefined;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "string") return error;
    if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
        return error.message;
    }
    return fallback;
}

export default observer(PageBusAdminHome);