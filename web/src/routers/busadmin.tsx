import PageBusAdminIndex from "@/pages/busadmin/index";
import { ScreenDashboard } from "@/screens/dashboard";
import ScreenLoading from "@/screens/Loading";
import { useStore } from "@/stores";
import { observer } from "mobx-react-lite";
import { Route, Routes } from "react-router-dom";

const RouterBusAdmin = observer(() => {
    const { user } = useStore();
    if (user.isLoading) return <ScreenLoading />;
    return (
        <ScreenDashboard role={1}>
            <Routes>
                <Route index element={<PageBusAdminIndex />} />
            </Routes>
        </ScreenDashboard>
    );
});

export default RouterBusAdmin;
