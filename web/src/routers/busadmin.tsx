import { Route, Routes } from "react-router-dom";
import { ScreenBusDashboard } from "@/screens/dashboard-busadmin";
import PageBusAdminHome from "@/pages/busadmin";
import { PageBusAdminBuses } from "@/pages/busadmin/buses";
import { PageBusAdminCompany } from "@/pages/busadmin/company";
import { PageBusAdminNotFoundError } from "@/pages/busadmin/index/404";
import { PageBusAdminTickets } from "@/pages/busadmin/tickets";
import { PageBusAdminTrips } from "@/pages/busadmin/trips";
import ScreenLoading from "@/screens/Loading";
import { useStore } from "@/stores";
import { observer } from "mobx-react-lite";

const RouterBusAdmin = observer(() => {
    const { user } = useStore();

    if (user.isLoading) return <ScreenLoading />;

    return (
        <ScreenBusDashboard>
            <Routes>
                <Route index element={<PageBusAdminHome />} />
                <Route path="company" element={<PageBusAdminCompany />} />
                <Route path="buses" element={<PageBusAdminBuses />} />
                <Route path="trips" element={<PageBusAdminTrips />} />
                <Route path="tickets" element={<PageBusAdminTickets />} />
                <Route path="*" element={<PageBusAdminNotFoundError />} />
            </Routes>
        </ScreenBusDashboard>
    );
});

export default RouterBusAdmin;