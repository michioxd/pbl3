import { getApiAdminSystemCompaniesByCompanyIdRoutes } from "@/api";
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

type Route = {
    routeID: string;
    routeName: string;
    departureProvinceCode: string | null;
    arrivalProvinceCode: string | null;
    distance: number;
    duration: number;
    isActive: boolean;
    tripsCount: number;
};

type CompanyRoutesTabProps = {
    companyId: string;
    onCountChange: (count: number) => void;
};

export function CompanyRoutesTab({ companyId, onCountChange }: CompanyRoutesTabProps) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRoutes = async () => {
            setLoading(true);
            try {
                const response = await getApiAdminSystemCompaniesByCompanyIdRoutes({
                    path: { companyId },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải danh sách tuyến");
                }

                const routesList = (response.data as unknown as Route[]) || [];
                setRoutes(routesList);
                onCountChange(routesList.length);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Không thể tải dữ liệu");
                onCountChange(0);
            } finally {
                setLoading(false);
            }
        };

        void loadRoutes();
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

    if (routes.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Chưa có tuyến xe nào
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
                                <TableHead>Tên tuyến</TableHead>
                                <TableHead>Điểm đi</TableHead>
                                <TableHead>Điểm đến</TableHead>
                                <TableHead className="text-right">Khoảng cách (km)</TableHead>
                                <TableHead className="text-right">Thời gian (giờ)</TableHead>
                                <TableHead className="text-center">Số chuyến</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {routes.map((route) => (
                                <TableRow key={route.routeID}>
                                    <TableCell className="font-medium">
                                        {route.routeName}
                                    </TableCell>
                                    <TableCell>
                                        {route.departureProvinceCode || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {route.arrivalProvinceCode || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {route.distance.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {route.duration.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {route.tripsCount}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={route.isActive ? "default" : "secondary"}>
                                            {route.isActive ? "Hoạt động" : "Ngưng hoạt động"}
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
