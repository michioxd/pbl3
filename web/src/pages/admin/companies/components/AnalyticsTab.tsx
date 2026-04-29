import { getApiAdminSystemCompaniesByCompanyIdAnalytics } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, DollarSign, TrendingUp, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Analytics = {
    totalRevenue: number;
    totalTicketsSold: number;
    totalTrips: number;
    completedTrips: number;
    year: number;
    month: number | null;
    monthlyRevenue: Array<{ month: number; revenue: number }>;
};

type CompanyAnalyticsTabProps = {
    companyId: string;
};

export function CompanyAnalyticsTab({ companyId }: CompanyAnalyticsTabProps) {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState<number | null>(null);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getApiAdminSystemCompaniesByCompanyIdAnalytics({
                path: { companyId },
                query: {
                    year,
                    month: month ?? undefined,
                },
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải dữ liệu phân tích");
            }

            setAnalytics(response.data as unknown as Analytics);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [companyId, year, month]);

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Không có dữ liệu phân tích
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
                <Select
                    value={month?.toString() ?? "all"}
                    onValueChange={(value) => {
                        setMonth(value === "all" ? null : Number(value));
                    }}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Cả năm</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <SelectItem key={m} value={m.toString()}>
                                Tháng {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={year.toString()}
                    onValueChange={(value) => setYear(Number(value))}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(
                            (y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Tổng doanh thu"
                    value={formatCurrency(analytics.totalRevenue)}
                    icon={<DollarSign className="h-4 w-4" />}
                    variant="success"
                />
                <StatCard
                    title="Vé đã bán"
                    value={analytics.totalTicketsSold.toLocaleString("vi-VN")}
                    icon={<TrendingUp className="h-4 w-4" />}
                    variant="default"
                />
                <StatCard
                    title="Tổng chuyến"
                    value={analytics.totalTrips.toLocaleString("vi-VN")}
                    icon={<Truck className="h-4 w-4" />}
                    variant="default"
                />
                <StatCard
                    title="Chuyến hoàn thành"
                    value={analytics.completedTrips.toLocaleString("vi-VN")}
                    icon={<BarChart3 className="h-4 w-4" />}
                    variant="default"
                />
            </div>

            {/* Monthly Revenue Chart */}
            {!month && analytics.monthlyRevenue.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Doanh thu theo tháng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics.monthlyRevenue.map((item) => (
                                <div
                                    key={item.month}
                                    className="flex items-center justify-between border-b pb-2 last:border-0"
                                >
                                    <span className="text-sm font-medium">Tháng {item.month}</span>
                                    <span className="text-sm font-bold text-green-600">
                                        {formatCurrency(item.revenue)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    variant,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    variant: "default" | "success";
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div
                    className={
                        variant === "success" ? "text-green-600" : "text-muted-foreground"
                    }
                >
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
}
