import PageAdminIndex from "@/pages/admin/index";
import { PageAdminPartnerCompanies } from "@/pages/admin/affiliates/companies";
import { PageAdminFinanceTransactions } from "@/pages/admin/finance/transactions";
import { PageAdminNotFoundError } from "@/pages/admin/index/404";
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
        <ScreenDashboard>
            <Routes>
                <Route index element={<PageAdminIndex />} />
                <Route path="users">
                    <Route index element={<PageAdminUsers />} />
                </Route>
                <Route path="upgrade-requests">
                    <Route index element={<PageAdminUpgradeRequests />} />
                </Route>
                <Route path="affiliates/companies">
                    <Route index element={<PageAdminPartnerCompanies />} />
                </Route>
                <Route path="finance/transactions">
                    <Route index element={<PageAdminFinanceTransactions />} />
                </Route>
                <Route path="*" element={<PageAdminNotFoundError />} />
            </Routes>
        </ScreenDashboard>
    );
});

export default RouterAdmin;
