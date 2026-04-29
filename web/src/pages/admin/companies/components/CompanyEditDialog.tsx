import { putApiAdminSystemCompaniesByCompanyIdProfile } from "@/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CompanyEditDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: {
        companyID: string;
        name: string;
        licenseNumber?: string | null;
        hotline?: string | null;
    } | null;
    onSuccess: () => void;
};

export function CompanyEditDialog({
    open,
    onOpenChange,
    company,
    onSuccess,
}: CompanyEditDialogProps) {
    const [form, setForm] = useState({
        name: company?.name ?? "",
        licenseNumber: company?.licenseNumber ?? "",
        hotline: company?.hotline ?? "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (company) {
            setForm({
                name: company.name,
                licenseNumber: company.licenseNumber ?? "",
                hotline: company.hotline ?? "",
            });
        }
    }, [company]);

    const handleSave = async () => {
        if (!company) return;

        if (!form.name.trim()) {
            toast.error("Tên nhà xe không được để trống");
            return;
        }

        setSaving(true);
        try {
            const response = await putApiAdminSystemCompaniesByCompanyIdProfile({
                path: { companyId: company.companyID },
                body: {
                    name: form.name.trim(),
                    licenseNumber: form.licenseNumber.trim() || null,
                    hotline: form.hotline.trim() || null,
                },
            });

            if (response.error) {
                throw new Error("Không thể cập nhật thông tin nhà xe");
            }

            toast.success("Đã cập nhật thông tin nhà xe");
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể cập nhật thông tin");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa thông tin nhà xe</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên nhà xe *</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="VD: Phương Trang"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="licenseNumber">Số giấy phép</Label>
                        <Input
                            id="licenseNumber"
                            value={form.licenseNumber}
                            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                            placeholder="VD: 01A-00001"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hotline">Hotline</Label>
                        <Input
                            id="hotline"
                            value={form.hotline}
                            onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                            placeholder="VD: 1900 6067"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
