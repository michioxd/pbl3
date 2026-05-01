import { getApiBusadminBusesCompanyProfile, putApiBusadminBusesCompanyProfile, type UpdateCompanyProfileDto } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CompanyProfile = {
    companyID?: string;
    name?: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    isApproved?: boolean;
};

export function PageBusAdminCompany() {
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [hotline, setHotline] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const response = await getApiBusadminBusesCompanyProfile();
            if (response.error || !response.data) {
                throw new Error("Không thể tải thông tin nhà xe.");
            }

            const data = normalizeCompanyProfile(response.data);
            setCompany(data);
            setName(data.name || "");
            setLicenseNumber(data.licenseNumber || "");
            setHotline(data.hotline || "");
            setError(null);
        } catch (e) {
            setCompany(null);
            setError(e instanceof Error ? e.message : "Không thể tải thông tin nhà xe.");
        } finally {
            setLoading(false);
        }
    }

    async function save(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!name.trim()) {
            toast.error("Vui lòng nhập tên nhà xe.");
            return;
        }

        setSaving(true);
        try {
            const payload: UpdateCompanyProfileDto = {
                name: name.trim(),
                licenseNumber: trimToNull(licenseNumber),
                hotline: trimToNull(hotline),
            };

            const response = await putApiBusadminBusesCompanyProfile({ body: payload });
            if (response.error) {
                throw new Error("Không thể cập nhật hồ sơ nhà xe.");
            }

            toast.success("Đã cập nhật hồ sơ nhà xe.");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể cập nhật hồ sơ nhà xe.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card className="border-slate-200 bg-white/95">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>Nhà xe</CardTitle>
                    <Badge variant="outline">{company?.isApproved ? "Đã duyệt" : "Chờ duyệt"}</Badge>
                </div>
                <CardDescription>Chỉnh sửa thông tin nhà xe đang được liên kết với tài khoản BusAdmin.</CardDescription>
            </CardHeader>
            <CardContent className="text-slate-900">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                        <Skeleton className="h-12 w-full rounded-2xl" />
                        <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>
                ) : error ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
                        <Button onClick={() => void load()}>Thử lại</Button>
                    </div>
                ) : (
                    <form className="space-y-5 text-slate-900" onSubmit={save}>
                        <div className="space-y-2">
                            <Label htmlFor="company-name" className="text-slate-700">
                                Tên nhà xe
                            </Label>
                            <Input
                                id="company-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="license-number" className="text-slate-700">
                                    Số giấy phép
                                </Label>
                                <Input
                                    id="license-number"
                                    value={licenseNumber}
                                    onChange={(e) => setLicenseNumber(e.target.value)}
                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hotline" className="text-slate-700">
                                    Hotline
                                </Label>
                                <Input
                                    id="hotline"
                                    value={hotline}
                                    onChange={(e) => setHotline(e.target.value)}
                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function normalizeCompanyProfile(data: unknown): CompanyProfile {
    if (!isRecord(data)) return {};
    return {
        companyID: pickString(data.companyID),
        name: pickString(data.name),
        licenseNumber: pickNullableString(data.licenseNumber),
        hotline: pickNullableString(data.hotline),
        isApproved: pickBoolean(data.isApproved),
    };
}

function trimToNull(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
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