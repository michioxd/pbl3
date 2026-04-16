import PageMainIndex from "@/pages/Main";
import PageMainSearch from "@/pages/Main/Search";
import { Route, Routes } from "react-router-dom";

export default function RouterMain() {
    return (
        <>
            <Routes>
                <Route index element={<PageMainIndex />} />
                <Route path="search" element={<PageMainSearch />} />
            </Routes>
        </>
    );
}
