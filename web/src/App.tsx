import { Route, Routes } from "react-router-dom";
import ScreenMain from "./screens/Main";
import { Suspense, lazy, useEffect } from "react";
import { useStore } from "./stores";
import { observer } from "mobx-react-lite";
import ScreenLoading from "./screens/Loading";

// eslint-disable-next-line react-refresh/only-export-components
const RouterAdmin = lazy(() => import("./routers/admin"));
// eslint-disable-next-line react-refresh/only-export-components
const RouterBusAdmin = lazy(() => import("./routers/busadmin"));

// eslint-disable-next-line react-refresh/only-export-components
const App = () => {
    const store = useStore();
    useEffect(() => {
        store.user.checkAuth();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <Routes>
                <Route path="/*" element={<ScreenMain />} />
                {store.user.isAuthenticated && store.user.user?.role.roleName === "SysAdmin" && (
                    <Route
                        path="/admin/*"
                        element={
                            <Suspense fallback={<ScreenLoading />}>
                                <RouterAdmin />
                            </Suspense>
                        }
                    />
                )}
                {store.user.isAuthenticated && store.user.user?.role.roleName === "BusAdmin" && (
                    <Route
                        path="/busadmin/*"
                        element={
                            <Suspense fallback={<ScreenLoading />}>
                                <RouterBusAdmin />
                            </Suspense>
                        }
                    />
                )}
            </Routes>
        </>
    );
};

export default observer(App);
