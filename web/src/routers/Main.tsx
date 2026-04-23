import PageMainIndex from "@/pages/Main";
import PageMainSearch from "@/pages/Main/search";
import Page404 from "@/screens/Main/404";
import { Route, Routes } from "react-router-dom";

export default function RouterMain() {
    return (
        <>
            <Routes>
                <Route index element={<PageMainIndex />} />
                <Route path="search" element={<PageMainSearch />} />
                <Route path="*" element={<Page404 />} />
            </Routes>
        </>
    );
}
