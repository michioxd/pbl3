import PageAdminIndex from "@/pages/admin/index";
import { PageAdminNotFoundError } from "@/pages/admin/index/404";
import { PageAdminCompanies } from "@/pages/admin/companies";
import { PageAdminCompanyDetail } from "@/pages/admin/companies/[id]";
import { PageAdminRevenue } from "@/pages/admin/revenue";
import { PageAdminTransactions } from "@/pages/admin/transactions";
import { PageAdminUpgradeRequests } from "@/pages/admin/upgrade-requests";
import { PageAdminUsers } from "@/pages/admin/users";
import { ScreenDashboard } from "@/screens/dashboard";
import ScreenLoading from "@/screens/Loading";
import { useStore } from "@/stores";
import { observer } from "mobx-react-lite";
import { Route, Routes } from "react-router-dom";

const RouterAdmin = observer(() => {
    const { user } = useStore();
    if (user.isLoading) return <ScreenLoading />;
    return (
        <ScreenDashboard role={0}>
            <Routes>
                <Route index element={<PageAdminIndex />} />
                <Route path="users">
                    <Route index element={<PageAdminUsers />} />
                </Route>
                <Route path="upgrade-requests">
                    <Route index element={<PageAdminUpgradeRequests />} />
                </Route>
                <Route path="companies">
                    <Route index element={<PageAdminCompanies />} />
                    <Route path=":companyId" element={<PageAdminCompanyDetail />} />
                </Route>
                <Route path="transactions">
                    <Route index element={<PageAdminTransactions />} />
                </Route>
                <Route path="revenue">
                    <Route index element={<PageAdminRevenue />} />
                </Route>
                <Route path="*" element={<PageAdminNotFoundError />} />
            </Routes>
        </ScreenDashboard>
    );
});

export default RouterAdmin;
