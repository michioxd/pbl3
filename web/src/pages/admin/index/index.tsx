import { type AdminDashboardKpiDto, type AdminDashboardOverviewDto, getApiAdminSystemDashboardOverview } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Analytics } from "./components/analytics";
import { Overview } from "./components/overview";
import { RecentSales } from "./components/recent-sales";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function PageAdminIndex() {
    const [dashboard, setDashboard] = useState<AdminDashboardOverviewDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestDashboard = useCallback(async () => {
        const response = await getApiAdminSystemDashboardOverview();

        if (response.error || !response.data) {
            throw response.error ?? new Error("Không thể tải dữ liệu tổng quan");
        }

        return response.data;
    }, []);

    const fetchDashboard = useCallback(
        async (showRefreshing = false) => {
            if (showRefreshing) {
                setRefreshing(true);
                setError(null);
            }

            try {
                const data = await requestDashboard();
                setDashboard(data);
            } catch (e) {
                console.error("Không thể tải dữ liệu tổng quan admin", e);
                setError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.");

                if (showRefreshing) {
                    toast.error("Làm mới dữ liệu thất bại");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [requestDashboard],
    );

    useEffect(() => {
        let active = true;

        requestDashboard()
            .then((data) => {
                if (!active) {
                    return;
                }

                setDashboard(data);
            })
            .catch((e) => {
                if (!active) {
                    return;
                }

                console.error("Không thể tải dữ liệu tổng quan admin", e);
                setError("Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.");
            })
            .finally(() => {
                if (!active) {
                    return;
                }

                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [requestDashboard]);

    const summaryCards = [
        {
            title: "Doanh thu tháng",
            value: currencyFormatter.format(dashboard?.revenue?.current ?? 0),
            helper: formatDelta(dashboard?.revenue, "so với tháng trước", true),
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
        },
        {
            title: "Vé bán thành công",
            value: numberFormatter.format(Math.round(dashboard?.soldTickets?.current ?? 0)),
            helper: formatDelta(dashboard?.soldTickets, "so với tháng trước"),
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                </svg>
            ),
        },
        {
            title: "Chuyến xe trong tháng",
            value: numberFormatter.format(Math.round(dashboard?.totalTrips?.current ?? 0)),
            helper: formatDelta(dashboard?.totalTrips, "so với tháng trước"),
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                >
                    <path d="M8 6v6" />
                    <path d="M15 6v6" />
                    <path d="M2 12h19.6" />
                    <path d="M18 18h3s.5-8.5-3-8.5H5.5A3.5 3.5 0 0 0 2 13v5h3" />
                    <circle cx="7" cy="18" r="2" />
                    <path d="M9 18h5" />
                    <circle cx="16" cy="18" r="2" />
                </svg>
            ),
        },
        {
            title: "Người dùng mới",
            value: numberFormatter.format(Math.round(dashboard?.newUsers?.current ?? 0)),
            helper: formatDelta(dashboard?.newUsers, "so với tháng trước"),
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6" />
                    <path d="M22 11h-6" />
                </svg>
            ),
        },
    ];

    return (
        <>
            <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
                        <Badge variant="outline">{dashboard?.currentMonthLabel ?? "Đang tải dữ liệu"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi doanh thu, vé bán, chuyến xe và hoạt động vận hành của hệ thống bán vé xe.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => fetchDashboard(true)} disabled={loading || refreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        Làm mới dữ liệu
                    </Button>
                </div>
            </div>

            <Tabs orientation="horizontal" defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="analytics">Phân tích</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {error ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Không thể tải dữ liệu</CardTitle>
                                <CardDescription>{error}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={() => fetchDashboard(true)}>Thử lại</Button>
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {summaryCards.map((card) => (
                            <Card key={card.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                    {card.icon}
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <>
                                            <Skeleton className="mb-2 h-8 w-32" />
                                            <Skeleton className="h-4 w-40" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold">{card.value}</div>
                                            <p className="text-xs text-muted-foreground">{card.helper}</p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-7">
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Hiệu suất 6 tháng gần nhất</CardTitle>
                                <CardDescription>
                                    Doanh thu theo tháng và số vé bán thành công trên toàn nền tảng.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="ps-2">
                                {loading ? (
                                    <Skeleton className="h-87.5 w-full" />
                                ) : (
                                    <Overview data={dashboard?.monthlyStats ?? []} />
                                )}
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Đơn đặt vé mới nhất</CardTitle>
                                <CardDescription>
                                    {loading
                                        ? "Đang tải dữ liệu đơn hàng gần đây"
                                        : `Cập nhật lúc ${formatDateTime(dashboard?.lastUpdatedAt)}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <RecentSales loading items={[]} />
                                ) : (
                                    <RecentSales items={dashboard?.recentBookings ?? []} />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <MetricMiniCard
                            title="Tổng doanh nghiệp"
                            value={numberFormatter.format(dashboard?.snapshot?.totalCompanies ?? 0)}
                            description={`${numberFormatter.format(dashboard?.snapshot?.approvedCompanies ?? 0)} doanh nghiệp đã được duyệt`}
                            loading={loading}
                        />
                        <MetricMiniCard
                            title="Chuyến đang chạy hôm nay"
                            value={numberFormatter.format(dashboard?.snapshot?.activeTripsToday ?? 0)}
                            description={`${numberFormatter.format(dashboard?.snapshot?.totalRoutes ?? 0)} tuyến đang được quản lý`}
                            loading={loading}
                        />
                        <MetricMiniCard
                            title="Yêu cầu nâng cấp chờ duyệt"
                            value={numberFormatter.format(dashboard?.snapshot?.pendingUpgradeRequests ?? 0)}
                            description={`Giá vé trung bình ${currencyFormatter.format(dashboard?.snapshot?.averageTicketPrice ?? 0)}`}
                            loading={loading}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Analytics
                        dashboard={dashboard}
                        loading={loading}
                        compactCurrencyFormatter={compactCurrencyFormatter}
                    />
                </TabsContent>
            </Tabs>
        </>
    );
}

function MetricMiniCard({
    title,
    value,
    description,
    loading,
}: {
    title: string;
    value: string;
    description: string;
    loading: boolean;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="mb-2 h-8 w-24" />
                        <Skeleton className="h-4 w-40" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function formatDelta(kpi: AdminDashboardKpiDto | undefined, suffix: string, isCurrency = false) {
    const percent = kpi?.deltaPercent ?? 0;
    const delta = kpi?.delta ?? 0;
    const sign = delta > 0 ? "+" : delta < 0 ? "" : "±";
    const formattedDelta = isCurrency
        ? currencyFormatter.format(Math.abs(delta))
        : numberFormatter.format(Math.abs(Math.round(delta)));

    if ((kpi?.previous ?? 0) === 0 && (kpi?.current ?? 0) > 0) {
        return `${sign}${formattedDelta} • mới phát sinh ${suffix}`;
    }

    return `${sign}${formattedDelta} (${percent.toFixed(1)}%) ${suffix}`;
}

function formatDateTime(value?: string | null) {
    if (!value) {
        return "--";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}
