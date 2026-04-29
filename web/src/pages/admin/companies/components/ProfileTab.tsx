import { getApiAdminSystemCompaniesByCompanyIdProfile } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CompanyProfile = {
    companyID: string;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    status: number;
    createdAt: string;
};

type CompanyProfileTabProps = {
    companyId: string;
};

export function CompanyProfileTab({ companyId }: CompanyProfileTabProps) {
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const response = await getApiAdminSystemCompaniesByCompanyIdProfile({
                    path: { companyId },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải thông tin nhà xe");
                }

                setCompany(response.data as unknown as CompanyProfile);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Không thể tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, [companyId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!company) {
        return (
            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                    Không tìm thấy thông tin nhà xe
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <InfoRow label="Tên nhà xe" value={company.name} />
                    <InfoRow
                        label="Số giấy phép"
                        value={company.licenseNumber || "Chưa có"}
                    />
                    <InfoRow label="Hotline" value={company.hotline || "Chưa có"} />
                    <InfoRow
                        label="Trạng thái"
                        value={formatCompanyStatus(company.status)}
                    />
                    <InfoRow label="Ngày tạo" value={formatDate(company.createdAt)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin bổ sung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Chức năng quản lý admin nhà xe sẽ được bổ sung sau.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between border-b pb-2 last:border-0">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

function formatCompanyStatus(status: number): string {
    switch (status) {
        case 0:
            return "Chờ duyệt";
        case 1:
            return "Đã duyệt";
        case 2:
            return "Tạm ngưng";
        case 3:
            return "Đã từ chối";
        default:
            return "Không xác định";
    }
}

function formatDate(value: string) {
    if (!value) return "Không xác định";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "Không hợp lệ";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
