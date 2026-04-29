import { getApiAdminSystemCompaniesByCompanyIdTrips } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Trip = {
    tripID: string;
    departureTime: string;
    arrivalTime: string;
    busPlateNumber: string;
    routeName: string;
    availableSeats: number;
    totalSeats: number;
    status: string;
};

type CompanyTripsTabProps = {
    companyId: string;
};

export function CompanyTripsTab({ companyId }: CompanyTripsTabProps) {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalPages, setTotalPages] = useState(1);

    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    const loadTrips = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getApiAdminSystemCompaniesByCompanyIdTrips({
                path: { companyId },
                query: {
                    month,
                    year,
                    page,
                    pageSize,
                },
            });

            if (response.error || !response.data) {
                throw new Error("Không thể tải danh sách chuyến xe");
            }

            const data = response.data as any;
            setTrips(data.items || []);
            setTotalPages(data.totalPages || 1);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [companyId, month, year, page, pageSize]);

    useEffect(() => {
        void loadTrips();
    }, [loadTrips]);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                {/* Filters */}
                <div className="flex items-center gap-3 border-b p-4">
                    <Select
                        value={month.toString()}
                        onValueChange={(value) => {
                            setMonth(Number(value));
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <SelectItem key={m} value={m.toString()}>
                                    Tháng {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={year.toString()}
                        onValueChange={(value) => {
                            setYear(Number(value));
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(
                                (y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {trips.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                        Không có chuyến xe nào trong khoảng thời gian này
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tuyến</TableHead>
                                        <TableHead>Xe</TableHead>
                                        <TableHead>Khởi hành</TableHead>
                                        <TableHead>Đến nơi</TableHead>
                                        <TableHead className="text-center">Ghế trống</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trips.map((trip) => (
                                        <TableRow key={trip.tripID}>
                                            <TableCell className="font-medium">
                                                {trip.routeName}
                                            </TableCell>
                                            <TableCell>{trip.busPlateNumber}</TableCell>
                                            <TableCell>{formatDateTime(trip.departureTime)}</TableCell>
                                            <TableCell>{formatDateTime(trip.arrivalTime)}</TableCell>
                                            <TableCell className="text-center">
                                                {trip.availableSeats}/{trip.totalSeats}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getTripStatusVariant(trip.status)}>
                                                    {formatTripStatus(trip.status)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t p-4">
                            <p className="text-sm text-muted-foreground">
                                Trang {page} / {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function formatDateTime(value: string) {
    if (!value) return "N/A";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatTripStatus(status: string): string {
    switch (status.toLowerCase()) {
        case "scheduled":
            return "Đã lên lịch";
        case "completed":
            return "Hoàn thành";
        case "cancelled":
            return "Đã hủy";
        default:
            return status;
    }
}

function getTripStatusVariant(status: string): "default" | "secondary" | "destructive" {
    switch (status.toLowerCase()) {
        case "scheduled":
            return "default";
        case "completed":
            return "secondary";
        case "cancelled":
            return "destructive";
        default:
            return "default";
    }
}
