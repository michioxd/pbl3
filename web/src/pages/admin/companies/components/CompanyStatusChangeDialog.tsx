import { patchApiAdminSystemCompaniesByCompanyIdStatus } from "@/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type CompanyStatusChangeDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: {
        companyID: string;
        name: string;
        status: number;
    } | null;
    onSuccess: () => void;
};

export function CompanyStatusChangeDialog({
    open,
    onOpenChange,
    company,
    onSuccess,
}: CompanyStatusChangeDialogProps) {
    const [newStatus, setNewStatus] = useState<string>((company?.status ?? 0).toString());
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (company && company.status !== undefined) {
            setNewStatus(company.status.toString());
        }
    }, [company]);

    const handleSubmit = async () => {
        if (!company) return;

        setSaving(true);
        try {
            const response = await patchApiAdminSystemCompaniesByCompanyIdStatus({
                path: { companyId: company.companyID },
                body: {
                    status: Number(newStatus),
                    notes: notes.trim() || undefined,
                },
            });

            if (response.error) {
                throw new Error("Không thể cập nhật trạng thái");
            }

            toast.success("Đã cập nhật trạng thái nhà xe");
            onSuccess();
            onOpenChange(false);
            setNotes("");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể cập nhật trạng thái");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Đổi trạng thái nhà xe</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            Nhà xe: <span className="font-medium text-foreground">{company?.name}</span>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Trạng thái mới</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Chờ duyệt</SelectItem>
                                <SelectItem value="1">Đã duyệt</SelectItem>
                                <SelectItem value="2">Tạm ngưng</SelectItem>
                                <SelectItem value="3">Đã từ chối</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Ghi chú</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Lý do thay đổi trạng thái (tùy chọn)"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
