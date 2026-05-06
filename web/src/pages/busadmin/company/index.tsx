import { getApiBusadminBusesCompanyProfile } from "@/api";
import { createBusadminCompanyUpdateRequest } from "@/api/company-update-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type BusAdminCompanyProfile = {
    companyID: string;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    isApproved: boolean;
};

export function PageBusAdminCompany() {
    const [company, setCompany] = useState<BusAdminCompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        licenseNumber: "",
        hotline: "",
    });

    const loadCompany = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getApiBusadminBusesCompanyProfile();
            if (response.error || !response.data) {
                setCompany(null);
                return;
            }

            const data = response.data as BusAdminCompanyProfile;
            setCompany(data);
            setFormData({
                name: data.name ?? "",
                licenseNumber: data.licenseNumber ?? "",
                hotline: data.hotline ?? "",
            });
        } catch (error) {
            console.error("Không thể tải hồ sơ nhà xe", error);
            setCompany(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCompany();
    }, [loadCompany]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên nhà xe.");
            return;
        }

        setSaving(true);
        try {
            await createBusadminCompanyUpdateRequest({
                name: formData.name.trim(),
                licenseNumber: formData.licenseNumber.trim() || null,
                hotline: formData.hotline.trim() || null,
            });

            toast.success("Đã gửi yêu cầu cập nhật. Vui lòng chờ duyệt.");
            await loadCompany();
        } catch (error) {
            console.error("Không thể cập nhật nhà xe", error);
            toast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (!company) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Chưa có nhà xe</CardTitle>
                    <CardDescription>
                        Bạn cần tạo nhà xe trước khi chỉnh sửa hồ sơ.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/busadmin">Quay lại trang tổng quan</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hồ sơ nhà xe</h1>
                    <p className="text-sm text-muted-foreground">Cập nhật thông tin hiển thị với hành khách.</p>
                </div>
                <Badge variant={company.isApproved ? "default" : "secondary"}>
                    {company.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin cơ bản</CardTitle>
                    <CardDescription>Thông tin này sẽ hiển thị cho khách hàng.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="company-name">Tên nhà xe</Label>
                            <Input
                                id="company-name"
                                value={formData.name}
                                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company-hotline">Hotline</Label>
                            <Input
                                id="company-hotline"
                                value={formData.hotline}
                                onChange={(event) => setFormData((prev) => ({ ...prev, hotline: event.target.value }))}
                            />
                        </div>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
