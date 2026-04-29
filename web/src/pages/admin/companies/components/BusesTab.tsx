import { getApiAdminSystemCompaniesByCompanyIdBuses } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Bus = {
    busID: string;
    plateNumber: string;
    busType: {
        busTypeID: string;
        name: string;
        totalSeats: number;
        amenities: string;
    };
    capacity: number;
    isActive: boolean;
};

type CompanyBusesTabProps = {
    companyId: string;
    onCountChange: (count: number) => void;
};

export function CompanyBusesTab({ companyId, onCountChange }: CompanyBusesTabProps) {
    const [buses, setBuses] = useState<Bus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBuses = async () => {
            setLoading(true);
            try {
                const response = await getApiAdminSystemCompaniesByCompanyIdBuses({
                    path: { companyId },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải danh sách xe");
                }

                const busList = (response.data as unknown as Bus[]) || [];
                setBuses(busList);
                onCountChange(busList.length);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Không thể tải dữ liệu");
                onCountChange(0);
            } finally {
                setLoading(false);
            }
        };

        void loadBuses();
    }, [companyId, onCountChange]);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (buses.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Chưa có xe nào
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Biển số</TableHead>
                                <TableHead>Loại xe</TableHead>
                                <TableHead className="text-center">Số ghế</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {buses.map((bus) => (
                                <TableRow key={bus.busID}>
                                    <TableCell className="font-medium">
                                        {bus.plateNumber}
                                    </TableCell>
                                    <TableCell>{bus.busType.name}</TableCell>
                                    <TableCell className="text-center">{bus.capacity}</TableCell>
                                    <TableCell>
                                        <Badge variant={bus.isActive ? "default" : "secondary"}>
                                            {bus.isActive ? "Hoạt động" : "Ngưng hoạt động"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
