import PageMainIndex from "@/pages/Main";
import PageMainBooking from "@/pages/Main/booking";
import PageBookingPaymentResult from "@/pages/Main/booking/payment-result";
import PageMainSearch from "@/pages/Main/search";
import PageManageOrders from "@/pages/Main/orders";
import PagePartnerRegistration from "@/pages/Main/partner-registration";
import Page404 from "@/screens/Main/404";
import { Route, Routes } from "react-router-dom";

export default function RouterMain() {
    return (
        <>
            <Routes>
                <Route index element={<PageMainIndex />} />
                <Route path="search" element={<PageMainSearch />} />
                <Route path="booking/payment-result" element={<PageBookingPaymentResult />} />
                <Route path="booking/:tripId" element={<PageMainBooking />} />
                <Route path="orders" element={<PageManageOrders />} />
                <Route path="partner-registration" element={<PagePartnerRegistration />} />
                <Route path="*" element={<Page404 />} />
            </Routes>
        </>
    );
}
