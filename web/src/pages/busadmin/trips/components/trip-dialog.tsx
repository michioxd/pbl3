import { postApiBusadminBusesTrips, putApiBusadminBusesTripsByTripId } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const todayInputValue = () => toDateInputValue(new Date());

const fromDateInputValue = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
};

const formatSelectedDate = (value: string) =>
    fromDateInputValue(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

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

const createInitialForm = (trip: BusAdminTripListItem | null) => {
    if (trip) {
        return {
            routeID: trip.routeID,
            busTypeID: trip.busTypeID,
            busID: trip.busID ?? "",
            departureDate: trip.departureDate.split("T")[0],
            departureDates: [] as string[],
            departureTime: new Date(trip.departureTime).toISOString().substring(11, 16),
            arrivalTime: new Date(trip.arrivalTime).toISOString().substring(11, 16),
            status: trip.status,
        };
    }

    return {
        routeID: "",
        busTypeID: "",
        busID: "",
        departureDate: todayInputValue(),
        departureDates: [todayInputValue()],
        departureTime: "08:00",
        arrivalTime: "10:00",
        status: 0,
    };
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
    const formKey = `${open ? "open" : "closed"}-${trip?.tripID ?? "new"}`;
    const [loadedFormKey, setLoadedFormKey] = useState(formKey);
    const [form, setForm] = useState(() => createInitialForm(trip));
    const [saving, setSaving] = useState(false);

    if (loadedFormKey !== formKey) {
        setLoadedFormKey(formKey);
        setForm(createInitialForm(trip));
    }

    const selectedDates = form.departureDates.map(fromDateInputValue);

    const handleCalendarSelect = (dates: Date[] | undefined) => {
        setForm({
            ...form,
            departureDates: (dates ?? [])
                .map(toDateInputValue)
                .filter((date) => date >= todayInputValue())
                .sort(),
        });
    };

    const handleSave = async () => {
        if (!form.routeID.trim()) {
            toast.error("ID Tuyến đường không được để trống");
            return;
        }
        if (!form.busTypeID.trim()) {
            toast.error("ID Loại xe không được để trống");
            return;
        }
        const departureDates = trip ? [form.departureDate] : form.departureDates;
        if (departureDates.length === 0 || departureDates.some((date) => !date)) {
            toast.error("Ngày khởi hành không được để trống");
            return;
        }
        if (departureDates.some((date) => date < todayInputValue())) {
            toast.error("Ngày khởi hành phải từ hôm nay trở đi");
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
                departureDate: departureDates[0],
                departureDates: trip ? undefined : departureDates,
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

                    {trip ? (
                        <div className="space-y-2">
                            <Label htmlFor="departureDate">Ngày khởi hành *</Label>
                            <Input
                                id="departureDate"
                                type="date"
                                min={todayInputValue()}
                                value={form.departureDate}
                                onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Lịch chạy *</Label>
                            <div className="rounded-md border p-2">
                                <Calendar
                                    mode="multiple"
                                    selected={selectedDates}
                                    disabled={{ before: fromDateInputValue(todayInputValue()) }}
                                    onSelect={handleCalendarSelect}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                    Đã chọn {form.departureDates.length} ngày chạy.
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={form.departureDates.length === 0}
                                    onClick={() => setForm({ ...form, departureDates: [] })}
                                >
                                    Xóa tất cả
                                </Button>
                            </div>
                            <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-md bg-muted/40 p-2">
                                {form.departureDates.map((date) => (
                                    <Badge
                                        key={date}
                                        variant="secondary"
                                        className="h-7 cursor-pointer gap-1 pr-1"
                                        title="Bấm để bỏ ngày này"
                                    >
                                        {formatSelectedDate(date)}
                                        <button
                                            type="button"
                                            className="rounded-full p-0.5 hover:bg-background/80"
                                            onClick={() =>
                                                setForm({
                                                    ...form,
                                                    departureDates: form.departureDates.filter((item) => item !== date),
                                                })
                                            }
                                        >
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">Bỏ ngày {formatSelectedDate(date)}</span>
                                        </button>
                                    </Badge>
                                ))}
                                {form.departureDates.length === 0 && (
                                    <span className="text-xs text-muted-foreground">Chưa chọn ngày chạy nào.</span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Bấm trực tiếp trên lịch để chọn nhiều ngày cho cùng tuyến, xe, loại xe và khung giờ.
                            </p>
                        </div>
                    )}

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
