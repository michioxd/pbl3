import { Route, Routes } from "react-router-dom";
import ScreenMain from "./screens/Main";
import { useEffect } from "react";
import { useStore } from "./stores";
import { observer } from "mobx-react-lite";

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
            </Routes>
        </>
    );
};

export default observer(App);
