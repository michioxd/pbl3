import { getApiBusadminBusesCompanyProfile, getApiBusadminCompanyUpdateRequestsCurrent } from "@/api";
import PageBusAdminIndex from "@/pages/busadmin/index";
import { PageBusAdminTickets } from "@/pages/busadmin/tickets";
import { PageBusAdminTrips } from "@/pages/busadmin/trips";
import { PageBusAdminBuses } from "@/pages/busadmin/buses";
import { PageBusAdminCompany } from "@/pages/busadmin/company";
import { ScreenDashboard } from "@/screens/dashboard";
import ScreenLoading from "@/screens/Loading";
import { useStore } from "@/stores";
import { observer } from "mobx-react-lite";
import { useEffect, useState, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

type BusAdminCompanyProfile = {
    companyID: string;
    name: string;
    licenseNumber?: string | null;
    hotline?: string | null;
    isApproved: boolean;
};

type BusAdminCompanyUpdateRequest = {
    status: number;
};

const BusAdminGate = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [isApproved, setIsApproved] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);

    useEffect(() => {
        let isActive = true;

        const fetchCompanyProfile = async () => {
            setLoading(true);
            try {
                const response = await getApiBusadminBusesCompanyProfile();
                if (!response.data || response.error) {
                    if (isActive) {
                        setIsApproved(false);
                        setHasPendingRequest(false);
                    }
                    return;
                }

                const company = response.data as BusAdminCompanyProfile;
                const requestResponse = await getApiBusadminCompanyUpdateRequestsCurrent().catch(() => null);
                const request =
                    requestResponse && !requestResponse.error
                        ? ((requestResponse.data as BusAdminCompanyUpdateRequest | null) ?? null)
                        : null;
                if (isActive) {
                    setIsApproved(!!company.isApproved);
                    setHasPendingRequest(!!request && request.status === 0);
                }
            } catch (error) {
                if (isActive) {
                    setIsApproved(false);
                    setHasPendingRequest(false);
                }
                console.error("Không thể kiểm tra trạng thái nhà xe", error);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void fetchCompanyProfile();

        return () => {
            isActive = false;
        };
    }, []);

    if (loading) return <ScreenLoading />;

    if (!isApproved || hasPendingRequest) return <PageBusAdminIndex />;

    return <>{children}</>;
};

const RouterBusAdmin = observer(() => {
    const { user } = useStore();
    if (user.isLoading) return <ScreenLoading />;
    return (
        <ScreenDashboard role={1}>
            <Routes>
                <Route index element={<PageBusAdminIndex />} />
                <Route
                    path="tickets"
                    element={
                        <BusAdminGate>
                            <PageBusAdminTickets />
                        </BusAdminGate>
                    }
                />
                <Route
                    path="trips"
                    element={
                        <BusAdminGate>
                            <PageBusAdminTrips />
                        </BusAdminGate>
                    }
                />
                <Route
                    path="buses"
                    element={
                        <BusAdminGate>
                            <PageBusAdminBuses />
                        </BusAdminGate>
                    }
                />
                <Route
                    path="company"
                    element={
                        <BusAdminGate>
                            <PageBusAdminCompany />
                        </BusAdminGate>
                    }
                />
                <Route path="*" element={<PageBusAdminIndex />} />
            </Routes>
        </ScreenDashboard>
    );
});

export default RouterBusAdmin;
