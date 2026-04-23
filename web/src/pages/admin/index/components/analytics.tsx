import type { AdminDashboardOverviewDto } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsChart } from "./analytics-chart";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function Analytics({
    dashboard,
    loading,
    compactCurrencyFormatter,
}: {
    dashboard: AdminDashboardOverviewDto | null;
    loading: boolean;
    compactCurrencyFormatter: Intl.NumberFormat;
}) {
    const snapshot = dashboard?.snapshot;
    const topRoutes = dashboard?.topRoutes ?? [];
    const ticketStatusBreakdown = dashboard?.ticketStatusBreakdown ?? [];
    const upgradeRequestBreakdown = dashboard?.upgradeRequestBreakdown ?? [];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Biến động theo ngày trong tháng</CardTitle>
                    <CardDescription>So sánh vé bán, vé hủy và doanh thu theo từng ngày.</CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                    {loading ? (
                        <Skeleton className="h-75 w-full" />
                    ) : (
                        <AnalyticsChart data={dashboard?.dailyStats ?? []} />
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    title="Tổng người dùng"
                    value={numberFormatter.format(snapshot?.totalUsers ?? 0)}
                    description="Toàn bộ tài khoản đang có trên hệ thống"
                    loading={loading}
                />
                <InfoCard
                    title="Tỷ lệ hủy vé"
                    value={`${(snapshot?.cancellationRatePercent ?? 0).toFixed(2)}%`}
                    description="Tính trên toàn bộ vé phát sinh trong tháng"
                    loading={loading}
                />
                <InfoCard
                    title="Giá vé trung bình"
                    value={currencyFormatter.format(snapshot?.averageTicketPrice ?? 0)}
                    description="Mức giá trung bình của các vé bán thành công"
                    loading={loading}
                />
                <InfoCard
                    title="Chuyến xe tháng này"
                    value={numberFormatter.format(snapshot?.totalTripsThisMonth ?? 0)}
                    description="Tổng số chuyến đã mở bán trong tháng hiện tại"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Tuyến đường nổi bật</CardTitle>
                        <CardDescription>Top tuyến có doanh thu và lượng vé tốt nhất trong tháng.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <SkeletonList rows={5} />
                        ) : topRoutes.length > 0 ? (
                            <SimpleBarList
                                items={topRoutes.map((route) => ({
                                    name: route.routeName ?? "Chưa xác định",
                                    value: route.ticketsSold ?? 0,
                                    secondary: compactCurrencyFormatter.format(route.revenue ?? 0),
                                }))}
                                barClass="bg-primary"
                                valueFormatter={(n) => `${numberFormatter.format(n)} vé`}
                            />
                        ) : (
                            <EmptyState message="Chưa có dữ liệu tuyến đường trong tháng này." />
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Trạng thái vận hành</CardTitle>
                        <CardDescription>Tỷ trọng vé và yêu cầu nâng cấp trong kỳ hiện tại.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {loading ? (
                            <SkeletonList rows={6} />
                        ) : (
                            <>
                                <StatusSection title="Vé trong tháng" items={ticketStatusBreakdown} />
                                <StatusSection
                                    title="Yêu cầu nâng cấp"
                                    items={upgradeRequestBreakdown}
                                    badgeVariant="secondary"
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function InfoCard({
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <>
                        <Skeleton className="mb-2 h-8 w-28" />
                        <Skeleton className="h-4 w-44" />
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

function StatusSection({
    title,
    items,
    badgeVariant = "outline",
}: {
    title: string;
    items: Array<{ label?: string | null; value?: number }>;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{title}</h3>
                <Badge variant={badgeVariant}>
                    Tổng {numberFormatter.format(items.reduce((sum, item) => sum + (item.value ?? 0), 0))}
                </Badge>
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-semibold">{numberFormatter.format(item.value ?? 0)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SimpleBarList({
    items,
    valueFormatter,
    barClass,
}: {
    items: { name: string; value: number; secondary: string }[];
    valueFormatter: (n: number) => string;
    barClass: string;
}) {
    const max = Math.max(...items.map((i) => i.value), 1);

    return (
        <ul className="space-y-3">
            {items.map((item) => {
                const width = `${Math.round((item.value / max) * 100)}%`;

                return (
                    <li key={item.name} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <div className="truncate text-sm font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.secondary}</div>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-muted">
                                <div className={`h-2.5 rounded-full ${barClass}`} style={{ width }} />
                            </div>
                        </div>
                        <div className="ps-2 text-xs font-medium tabular-nums">{valueFormatter(item.value)}</div>
                    </li>
                );
            })}
        </ul>
    );
}

function SkeletonList({ rows }: { rows: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2.5 w-full" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}
