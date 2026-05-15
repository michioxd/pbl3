import { getApiAdminSystemCompaniesByCompanyIdProfile } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CompanyEditDialog } from "./components/CompanyEditDialog";
import { CompanyStatusChangeDialog } from "./components/CompanyStatusChangeDialog";
import { CompanyProfileTab } from "./components/ProfileTab";
import { CompanyBusesTab } from "./components/BusesTab";
import { CompanyRoutesTab } from "./components/RoutesTab";
import { CompanyTripsTab } from "./components/TripsTab";
import { CompanyAnalyticsTab } from "./components/AnalyticsTab";

type CompanyProfile = {
    companyID: string;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    status: number;
    createdAt: string;
};

export function PageAdminCompanyDetail() {
    const { companyId } = useParams<{ companyId: string }>();
    const [activeTab, setActiveTab] = useState("profile");
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [busCount, setBusCount] = useState(0);
    const [routeCount, setRouteCount] = useState(0);

    // Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);

    useEffect(() => {
        const loadCompany = async () => {
            if (!companyId) return;

            setLoading(true);
            try {
                const response = await getApiAdminSystemCompaniesByCompanyIdProfile({
                    path: { companyId },
                });

                if (response.error || !response.data) {
                    throw new Error("Không thể tải thông tin nhà xe");
                }

                setCompany(response.data as unknown as CompanyProfile);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Không thể tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };

        void loadCompany();
    }, [companyId]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Không tìm thấy nhà xe
            </div>
        );
    }

    return (
        <div>
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/admin" className="hover:text-foreground">
                    Admin
                </Link>
                <span>/</span>
                <Link to="/admin/companies" className="hover:text-foreground">
                    Nhà xe
                </Link>
                <span>/</span>
                <span className="text-foreground">{company.name}</span>
            </nav>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <Link to="/admin/companies">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">{company.name}</h1>
                    </div>
                    <div className="ml-11">
                        <Badge variant={companyStatusBadgeVariant(company.status)}>
                            {formatCompanyStatus(company.status)}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                        Chỉnh sửa
                    </Button>
                    <Button onClick={() => setStatusDialogOpen(true)}>Đổi trạng thái</Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="profile">Thông tin</TabsTrigger>
                    <TabsTrigger value="buses">
                        Xe {busCount > 0 ? `(${busCount})` : ""}
                    </TabsTrigger>
                    <TabsTrigger value="routes">
                        Tuyến {routeCount > 0 ? `(${routeCount})` : ""}
                    </TabsTrigger>
                    <TabsTrigger value="trips">Chuyến xe</TabsTrigger>
                    <TabsTrigger value="analytics">Phân tích</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                    <CompanyProfileTab companyId={companyId!} />
                </TabsContent>

                <TabsContent value="buses" className="mt-4">
                    <CompanyBusesTab companyId={companyId!} onCountChange={setBusCount} />
                </TabsContent>

                <TabsContent value="routes" className="mt-4">
                    <CompanyRoutesTab companyId={companyId!} onCountChange={setRouteCount} />
                </TabsContent>

                <TabsContent value="trips" className="mt-4">
                    <CompanyTripsTab companyId={companyId!} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-4">
                    <CompanyAnalyticsTab companyId={companyId!} />
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <CompanyEditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                company={company}
                onSuccess={() => {
                    void loadCompany();
                }}
            />
            <CompanyStatusChangeDialog
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                company={company}
                onSuccess={() => {
                    void loadCompany();
                }}
            />
        </div>
    );

    async function loadCompany() {
        if (!companyId) return;

        try {
            const response = await getApiAdminSystemCompaniesByCompanyIdProfile({
                path: { companyId },
            });

            if (response.data) {
                setCompany(response.data as unknown as CompanyProfile);
            }
        } catch (e) {
            console.error("Failed to reload company", e);
        }
    }
}

function formatCompanyStatus(status: number): string {
    switch (status) {
        case 0:
            return "Chờ duyệt";
        case 1:
            return "Đã duyệt";
        case 2:
            return "Tạm ngưng";
        case 3:
            return "Đã từ chối";
        default:
            return "Không xác định";
    }
}

function companyStatusBadgeVariant(
    status: number
): "default" | "secondary" | "outline" | "destructive" {
    switch (status) {
        case 0:
            return "outline";
        case 1:
            return "default";
        case 2:
            return "destructive";
        case 3:
            return "secondary";
        default:
            return "outline";
    }
}
