import { postApiBusadminBusesTrips, putApiBusadminBusesTripsByTripId } from "@/api";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type BusAdminTripListItem = {
    tripID: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    status: number;
    routeID: string;
    routeName: string;
    busID?: string | null;
    busPlateNumber?: string | null;
    busTypeID: string;
    busTypeName?: string | null;
    ticketCount: number;
};

type SuggestionItem = { id: string; label: string };

type TripDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trip: BusAdminTripListItem | null;
    onSuccess: () => void;
    routes?: SuggestionItem[];
    busTypes?: SuggestionItem[];
    buses?: SuggestionItem[];
};

export function TripDialog({
    open,
    onOpenChange,
    trip,
    onSuccess,
    routes = [],
    busTypes = [],
    buses = [],
}: TripDialogProps) {
    const [form, setForm] = useState({
        routeID: "",
        busTypeID: "",
        busID: "",
        departureDate: "",
        departureTime: "",
        arrivalTime: "",
        status: 0,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (trip) {
            setForm({
                routeID: trip.routeID,
                busTypeID: trip.busTypeID,
                busID: trip.busID ?? "",
                departureDate: trip.departureDate.split("T")[0],
                departureTime: new Date(trip.departureTime).toISOString().substring(11, 16),
                arrivalTime: new Date(trip.arrivalTime).toISOString().substring(11, 16),
                status: trip.status,
            });
        } else {
            setForm({
                routeID: "",
                busTypeID: "",
                busID: "",
                departureDate: new Date().toISOString().split("T")[0],
                departureTime: "08:00",
                arrivalTime: "10:00",
                status: 0,
            });
        }
    }, [trip, open]);

    const handleSave = async () => {
        if (!form.routeID.trim()) {
            toast.error("ID Tuyến đường không được để trống");
            return;
        }
        if (!form.busTypeID.trim()) {
            toast.error("ID Loại xe không được để trống");
            return;
        }
        if (!form.departureDate) {
            toast.error("Ngày khởi hành không được để trống");
            return;
        }

        setSaving(true);
        try {
            // Combine date and time for backend if necessary, or let backend parse TimeSpan
            // DTO asks for string. We can just pass the raw input values.
            const body = {
                routeID: form.routeID.trim(),
                busTypeID: form.busTypeID.trim(),
                busID: form.busID.trim() || undefined,
                departureDate: form.departureDate,
                departureTime: form.departureTime + ":00", // ensure TimeSpan format HH:mm:ss
                arrivalTime: form.arrivalTime + ":00",
                status: form.status as 0 | 1 | 2 | 3,
            };

            if (trip) {
                // Update
                const response = await putApiBusadminBusesTripsByTripId({
                    path: { tripId: trip.tripID },
                    body,
                });

                if (response.error) {
                    throw new Error("Không thể cập nhật chuyến xe");
                }
                toast.success("Đã cập nhật chuyến xe");
            } else {
                // Create
                const response = await postApiBusadminBusesTrips({
                    body,
                });

                if (response.error) {
                    throw new Error("Không thể thêm chuyến xe");
                }
                toast.success("Đã thêm chuyến xe");
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
                    <DialogTitle>{trip ? "Cập nhật chuyến xe" : "Thêm chuyến xe mới"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="space-y-2">
                        <Label htmlFor="routeID">ID Tuyến xe *</Label>
                        <SearchableSelect
                            options={routes}
                            value={form.routeID}
                            onChange={(val) => setForm({ ...form, routeID: val })}
                            placeholder="Chọn tuyến xe hoặc nhập ID..."
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="busID">ID Xe (Tuỳ chọn)</Label>
                        <SearchableSelect
                            options={buses}
                            value={form.busID}
                            onChange={(val) => setForm({ ...form, busID: val })}
                            placeholder="Chọn xe hoặc nhập ID..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="departureDate">Ngày khởi hành *</Label>
                        <Input
                            id="departureDate"
                            type="date"
                            value={form.departureDate}
                            onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="departureTime">Giờ đi *</Label>
                            <Input
                                id="departureTime"
                                type="time"
                                value={form.departureTime}
                                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="arrivalTime">Giờ đến *</Label>
                            <Input
                                id="arrivalTime"
                                type="time"
                                value={form.arrivalTime}
                                onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Trạng thái</Label>
                        <Select
                            value={String(form.status)}
                            onValueChange={(val) => setForm({ ...form, status: Number(val) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Đã lên lịch</SelectItem>
                                <SelectItem value="1">Đang chạy</SelectItem>
                                <SelectItem value="2">Hoàn thành</SelectItem>
                                <SelectItem value="3">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
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
