import { getApiAdminSystemRevenueAnalytics } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowDownUp, ArrowUpRight, DollarSign, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// Local types (will be replaced after OpenAPI regeneration)
type RevenueSummaryDto = {
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    ticketsSold: number;
    totalRefunded: number;
    netRevenue: number;
    revenueGrowthPercent: number;
    transactionGrowthPercent: number;
};

type RevenueTrendDto = {
    date: string;
    revenue: number;
    transactionCount: number;
    ticketCount: number;
    refundAmount: number;
};

type RevenueByProviderDto = {
    provider: number;
    providerName: string;
    revenue: number;
    transactionCount: number;
    percentage: number;
};

type TopRouteRevenueDto = {
    routeID: string;
    routeName: string;
    revenue: number;
    ticketsSold: number;
    averageTicketPrice: number;
    companyID: string;
    companyName: string;
};

type RevenueByCompanyDto = {
    companyID: string;
    companyName: string;
    revenue: number;
    ticketsSold: number;
    tripCount: number;
    percentage: number;
};

type RevenueAnalyticsDto = {
    summary: RevenueSummaryDto;
    dailyTrends: RevenueTrendDto[];
    byProvider: RevenueByProviderDto[];
    topRoutes: TopRouteRevenueDto[];
    byCompany: RevenueByCompanyDto[];
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function PageAdminRevenue() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<RevenueAnalyticsDto | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await getApiAdminSystemRevenueAnalytics({
                query: {
                    topRoutesLimit: 10,
                    topCompaniesLimit: 10,
                },
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải dữ liệu phân tích doanh thu");
            }

            setData(response.data as unknown as RevenueAnalyticsDto);
            setError(null);
        } catch (e) {
            console.error("Failed to load revenue analytics", e);
            setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
            if (showRefreshing) {
                toast.error("Làm mới thất bại");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    if (loading && !data) {
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

    if (!data) return null;

    const { summary, dailyTrends, byProvider, topRoutes, byCompany } = data;

    // Transform data for charts
    const trendChartData = dailyTrends.map((t) => ({
        date: formatShortDate(t.date),
        revenue: t.revenue,
        refund: t.refundAmount,
    }));

    const providerChartData = byProvider.map((p) => ({
        name: formatProvider(p.provider),
        value: p.revenue,
        count: p.transactionCount,
    }));

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Phân tích doanh thu</h1>
                    <p className="text-sm text-muted-foreground">
                        Thống kê và phân tích doanh thu toàn hệ thống (30 ngày gần nhất)
                    </p>
                </div>

                <Button variant="outline" onClick={() => void fetchData(true)} disabled={refreshing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Tổng doanh thu"
                    value={formatCurrency(summary.totalRevenue)}
                    subtitle={`${summary.totalTransactions} giao dịch`}
                    growth={summary.revenueGrowthPercent}
                    icon={<DollarSign className="h-4 w-4" />}
                />
                <SummaryCard
                    title="Doanh thu thuần"
                    value={formatCurrency(summary.netRevenue)}
                    subtitle={`Đã trừ ${formatCurrency(summary.totalRefunded)} hoàn tiền`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    variant="success"
                />
                <SummaryCard
                    title="Vé đã bán"
                    value={formatNumber(summary.ticketsSold)}
                    subtitle={`Trung bình ${formatCurrency(summary.averageTransactionValue)}/GD`}
                    growth={summary.transactionGrowthPercent}
                    icon={<ArrowDownUp className="h-4 w-4" />}
                />
                <SummaryCard
                    title="Hoàn tiền"
                    value={formatCurrency(summary.totalRefunded)}
                    subtitle={`${(summary.totalRevenue === 0 ? 0 : (summary.totalRefunded / summary.totalRevenue) * 100).toFixed(1)}% tổng doanh thu`}
                    icon={<TrendingDown className="h-4 w-4" />}
                    variant="destructive"
                />
            </div>

            {/* Revenue Trend Chart */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Xu hướng doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trendChartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                            <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => formatShortCurrency(value)} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="text-sm font-medium">{payload[0].payload.date}</div>
                                                <div className="text-sm text-blue-600">
                                                    Doanh thu: {formatCurrency(payload[0].value as number)}
                                                </div>
                                                {payload[1] && (
                                                    <div className="text-sm text-red-600">
                                                        Hoàn tiền: {formatCurrency(payload[1].value as number)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                            <Area type="monotone" dataKey="refund" stroke="#ef4444" fillOpacity={0.2} fill="#ef4444" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="mb-4 grid gap-4 md:grid-cols-2">
                {/* Revenue by Provider */}
                <Card>
                    <CardHeader>
                        <CardTitle>Doanh thu theo phương thức</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={providerChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {providerChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="text-sm font-medium">{data.name}</div>
                                                    <div className="text-sm">{formatCurrency(data.value)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {data.count} giao dịch
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Routes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top tuyến đường</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topRoutes.slice(0, 5).map((route, index) => (
                                <div key={route.routeID} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{route.routeName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {route.companyName} • {route.ticketsSold} vé
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{formatCurrency(route.revenue)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            TB: {formatCurrency(route.averageTicketPrice)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue by Company */}
            <Card>
                <CardHeader>
                    <CardTitle>Doanh thu theo nhà xe</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={byCompany}>
                            <XAxis dataKey="companyName" stroke="#888888" fontSize={12} angle={-45} textAnchor="end" height={80} />
                            <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => formatShortCurrency(value)} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as RevenueByCompanyDto;
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="text-sm font-medium">{data.companyName}</div>
                                                <div className="text-sm">{formatCurrency(data.revenue)}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {data.ticketsSold} vé • {data.tripCount} chuyến
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {data.percentage.toFixed(1)}% tổng doanh thu
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </>
    );
}

function SummaryCard({
    title,
    value,
    subtitle,
    growth,
    icon,
    variant,
}: {
    title: string;
    value: string;
    subtitle?: string;
    growth?: number;
    icon: React.ReactNode;
    variant?: "default" | "success" | "destructive";
}) {
    const colorClass =
        variant === "success" ? "text-green-600" : variant === "destructive" ? "text-red-600" : "text-blue-600";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={cn("text-muted-foreground", colorClass)}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                {growth !== undefined && growth !== 0 && (
                    <div className={cn("mt-1 flex items-center gap-1 text-xs", growth > 0 ? "text-green-600" : "text-red-600")}>
                        {growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(growth).toFixed(1)}% so với kỳ trước
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatProvider(provider: number): string {
    switch (provider) {
        case 0:
            return "Momo";
        case 1:
            return "Stripe";
        case 2:
            return "Tiền mặt";
        default:
            return String(provider);
    }
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatShortCurrency(value: number) {
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value);
}

function formatShortDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    }).format(new Date(value));
}
