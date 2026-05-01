import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PageBusAdminNotFoundError() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Không tìm thấy trang</CardTitle>
                    <CardDescription>Đường dẫn BusAdmin này chưa được triển khai.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link to="/busadmin">Về dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}