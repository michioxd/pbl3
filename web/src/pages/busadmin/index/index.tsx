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
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
    getBusadminCompanyUpdateRequestCurrent,
    type CompanyProfileUpdateRequestDto,
} from "@/api/company-update-requests";
import { toast } from "sonner";

type BusAdminCompanyProfile = {
    companyID: string;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    isApproved: boolean;
};
type BusAdminMonthlyStats = {
    Year: number;
    Month: number;
    TotalTickets: number;
    SoldTickets: number;
    CancelledTickets: number;
    CancellationRatePercent: number;
    GrossRevenue: number;
    AverageTicketPrice: number;
    TotalTrips: number;
    AverageSoldTicketsPerTrip: number;
    TopRoutes: Array<{ RouteName: string; TicketsSold: number; Revenue: number }>;
    DailyStats: Array<{
        Date: string;
        TotalTickets: number;
        SoldTickets: number;
        CancelledTickets: number;
        Revenue: number;
    }>;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function PageBusAdminIndex() {
    const [company, setCompany] = useState<BusAdminCompanyProfile | null>(null);
    const [pendingRequest, setPendingRequest] = useState<CompanyProfileUpdateRequestDto | null>(null);
    const [companyState, setCompanyState] = useState<"loading" | "missing" | "pending" | "ready">("loading");
    const [stats, setStats] = useState<BusAdminMonthlyStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingCompany, setLoadingCompany] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        licenseNumber: "",
        hotline: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const currentPeriod = useMemo(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }, []);

    const fetchCompanyProfile = useCallback(async () => {
        setLoadingCompany(true);
        try {
            const response = await getApiBusadminBusesCompanyProfile();
            if (response.error || !response.data) {
                setCompany(null);
                setPendingRequest(null);
                setCompanyState("missing");
                return;
            }

            const data = response.data as BusAdminCompanyProfile;
            setCompany(data);
            const request = await getBusadminCompanyUpdateRequestCurrent().catch(() => null);
            setPendingRequest(request);

            if (request?.status === 0) {
                setCompanyState("pending");
                return;
            }

            setCompanyState(data.isApproved ? "ready" : "pending");
        } catch (error) {
            console.error("Không thể tải hồ sơ nhà xe", error);
            setCompany(null);
            setPendingRequest(null);
            setCompanyState("missing");
        } finally {
            setLoadingCompany(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const response = await getApiBusadminBusesStatsMonthly({
                query: {
                    year: currentPeriod.year,
                    month: currentPeriod.month,
                },
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải thống kê tháng.");
            }

            setStats(response.data as BusAdminMonthlyStats);
        } catch (error) {
            console.error("Không thể tải thống kê nhà xe", error);
            setStats(null);
        } finally {
            setLoadingStats(false);
        }
    }, [currentPeriod.month, currentPeriod.year]);

    useEffect(() => {
        void fetchCompanyProfile();
    }, [fetchCompanyProfile]);

    useEffect(() => {
        if (companyState === "ready") {
            void fetchStats();
        }
    }, [companyState, fetchStats]);

    const onSubmitCompany = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên nhà xe.");
            return;
        }

        setSubmitting(true);
        try {
            const payload: InforBusCompany = {
                name: formData.name.trim(),
                licenseNumber: formData.licenseNumber.trim() || null,
                hotline: formData.hotline.trim() || null,
            };

            const response = await postApiBusadminAddBusCompany({ body: payload });
            if (response.error) {
                throw new Error("Không thể đăng ký nhà xe.");
            }

            toast.success("Đã gửi thông tin nhà xe. Vui lòng chờ xét duyệt.");
            setFormData({ name: "", licenseNumber: "", hotline: "" });
            await fetchCompanyProfile();
        } catch (error) {
            console.error("Không thể gửi đăng ký nhà xe", error);
            toast.error("Không thể đăng ký nhà xe. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const isApproved = company?.isApproved ?? false;
    const statusBadge = isApproved ? "Đã duyệt" : "Chờ duyệt";
    const statusVariant = isApproved ? "default" : "secondary";

    if (companyState === "loading") {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-28 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (companyState === "missing") {
        return (
            <div className="max-w-2xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Đăng ký nhà xe</h1>
                    <p className="text-sm text-muted-foreground">
                        Bạn chưa có nhà xe nào. Vui lòng nhập thông tin để hệ thống tạo hồ sơ và chờ SysAdmin phê duyệt.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin nhà xe</CardTitle>
                        <CardDescription>Điền chính xác để hệ thống duyệt nhanh hơn.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={onSubmitCompany}>
                            <div className="space-y-2">
                                <Label htmlFor="company-name">Tên nhà xe</Label>
                                <Input
                                    id="company-name"
                                    value={formData.name}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="Ví dụ: Xe Thành Công"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company-license">Giấy phép kinh doanh</Label>
                                <Input
                                    id="company-license"
                                    value={formData.licenseNumber}
                                    onChange={(event) =>
                                        setFormData((prev) => ({ ...prev, licenseNumber: event.target.value }))
                                    }
                                    placeholder="Số giấy phép (nếu có)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company-hotline">Hotline</Label>
                                <Input
                                    id="company-hotline"
                                    value={formData.hotline}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, hotline: event.target.value }))}
                                    placeholder="Ví dụ: 1900 1234"
                                />
                            </div>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (companyState === "pending") {
        return (
            <div className="max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Chờ duyệt nhà xe</h1>
                        <p className="text-sm text-muted-foreground">
                            Hồ sơ nhà xe đang được SysAdmin xem xét. Bạn sẽ được mở quyền khi được duyệt.
                        </p>
                    </div>
                    <Button variant="outline" onClick={fetchCompanyProfile} disabled={loadingCompany}>
                        <RefreshCw className={cn("h-4 w-4", loadingCompany && "animate-spin")} />
                        Làm mới
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle>{pendingRequest?.name ?? company?.name ?? "Nhà xe"}</CardTitle>
                            <Badge variant={statusVariant}>{statusBadge}</Badge>
                        </div>
                        <CardDescription>Thông tin đăng ký hiện tại</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Giấy phép</span>
                            <span>{pendingRequest?.licenseNumber || company?.licenseNumber || "--"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Hotline</span>
                            <span>{pendingRequest?.hotline || company?.hotline || "--"}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Tổng quan nhà xe</h1>
                        <Badge variant={statusVariant}>{statusBadge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi tình hình bán vé và vận hành trong tháng {currentPeriod.month}/{currentPeriod.year}.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchStats} disabled={loadingStats}>
                    <RefreshCw className={cn("h-4 w-4", loadingStats && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        title: "Doanh thu tháng",
                        value: currencyFormatter.format(stats?.GrossRevenue ?? 0),
                        helper: `TB ${currencyFormatter.format(stats?.AverageTicketPrice ?? 0)} / vé`,
                    },
                    {
                        title: "Vé đã bán",
                        value: numberFormatter.format(stats?.SoldTickets ?? 0),
                        helper: `Tổng ${numberFormatter.format(stats?.TotalTickets ?? 0)} vé`,
                    },
                    {
                        title: "Vé đã hủy",
                        value: numberFormatter.format(stats?.CancelledTickets ?? 0),
                        helper: `Tỷ lệ ${stats?.CancellationRatePercent ?? 0}%`,
                    },
                    {
                        title: "Chuyến xe",
                        value: numberFormatter.format(stats?.TotalTrips ?? 0),
                        helper: `TB ${stats?.AverageSoldTicketsPerTrip ?? 0} vé/chuyến`,
                    },
                ].map((item) => (
                    <Card key={item.title}>
                        <CardHeader className="pb-2">
                            <CardDescription>{item.title}</CardDescription>
                            <CardTitle className="text-2xl">
                                {loadingStats ? <Skeleton className="h-7 w-28" /> : item.value}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">{item.helper}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Top tuyến bán chạy</CardTitle>
                        <CardDescription>5 tuyến có doanh thu tốt nhất trong tháng.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingStats ? (
                            <Skeleton className="h-40 w-full" />
                        ) : stats?.TopRoutes?.length ? (
                            <div className="space-y-3">
                                {stats.TopRoutes.map((route) => (
                                    <div key={route.RouteName} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{route.RouteName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {route.TicketsSold} vé
                                            </div>
                                        </div>
                                        <div className="font-medium">{currencyFormatter.format(route.Revenue)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Chưa có dữ liệu tuyến.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Hồ sơ nhà xe</CardTitle>
                        <CardDescription>Thông tin doanh nghiệp đang hoạt động.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tên nhà xe</span>
                            <span className="font-medium">{company?.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Giấy phép</span>
                            <span>{company?.licenseNumber || "--"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Hotline</span>
                            <span>{company?.hotline || "--"}</span>
                        </div>
                        <Button variant="outline" className="mt-3" asChild>
                            <Link to="/busadmin/company">Cập nhật hồ sơ</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
