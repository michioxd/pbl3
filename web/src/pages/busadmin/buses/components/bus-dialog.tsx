import { postApiBusadminBuses, putApiBusadminBusesById } from "@/api";
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
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type BusAdminBusListItem = {
    busID: string;
    plateNumber?: string | null;
    isActive: boolean;
    busType: {
        busTypeID: string;
        name: string;
        totalSeats: number;
        amenities?: string | null;
    };
};

type SuggestionItem = { id: string; label: string };

type BusDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bus: BusAdminBusListItem | null;
    onSuccess: () => void;
    busTypes?: SuggestionItem[];
};

export function BusDialog({
    open,
    onOpenChange,
    bus,
    onSuccess,
    busTypes = [],
}: BusDialogProps) {
    const [form, setForm] = useState({
        plateNumber: "",
        busTypeID: "",
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (bus) {
            setForm({
                plateNumber: bus.plateNumber ?? "",
                busTypeID: bus.busType.busTypeID,
                isActive: bus.isActive,
            });
        } else {
            setForm({
                plateNumber: "",
                busTypeID: "",
                isActive: true,
            });
        }
    }, [bus, open]);

    const handleSave = async () => {
        if (!form.plateNumber.trim()) {
            toast.error("Biển số xe không được để trống");
            return;
        }
        if (!form.busTypeID.trim()) {
            toast.error("ID Loại xe không được để trống");
            return;
        }

        setSaving(true);
        try {
            if (bus) {
                // Update
                const response = await putApiBusadminBusesById({
                    path: { id: bus.busID },
                    body: {
                        plateNumber: form.plateNumber.trim(),
                        busTypeID: form.busTypeID.trim(),
                        isActive: form.isActive,
                    },
                });

                if (response.error) {
                    throw new Error("Không thể cập nhật xe");
                }
                toast.success("Đã cập nhật xe");
            } else {
                // Create
                const response = await postApiBusadminBuses({
                    body: {
                        plateNumber: form.plateNumber.trim(),
                        busTypeID: form.busTypeID.trim(),
                        isActive: form.isActive,
                    },
                });

                if (response.error) {
                    throw new Error("Không thể thêm xe mới");
                }
                toast.success("Đã thêm xe mới");
            }

            onSuccess();
            onOpenChange(false);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{bus ? "Cập nhật xe" : "Thêm xe mới"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="plateNumber">Biển số xe *</Label>
                        <Input
                            id="plateNumber"
                            value={form.plateNumber}
                            onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                            placeholder="VD: 51B-123.45"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="busTypeID">ID Loại xe *</Label>
                        <SearchableSelect
                            options={busTypes}
                            value={form.busTypeID}
                            onChange={(val) => setForm({ ...form, busTypeID: val })}
                            placeholder="Chọn loại xe hoặc nhập ID..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Hãy copy ID loại xe từ các xe có sẵn hoặc xin từ quản trị viên hệ thống.
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={form.isActive}
                            onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Đang hoạt động</Label>
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
