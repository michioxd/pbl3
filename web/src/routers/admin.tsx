import PageAdminIndex from "@/pages/admin/index";
import { PageAdminNotFoundError } from "@/pages/admin/index/404";
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
                <Route path="*" element={<PageAdminNotFoundError />} />
            </Routes>
        </ScreenDashboard>
    );
});

export default RouterAdmin;
