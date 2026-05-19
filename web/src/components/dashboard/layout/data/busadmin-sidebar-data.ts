import { Building2, CalendarRange, LayoutDashboard, Ticket, BusFront } from "lucide-react";
import { type SidebarData } from "../types";

const busadminBasePath = "/busadmin";

export const busadminSidebarData: SidebarData = {
    teams: [
        {
            name: "XeNhanh BusAdmin",
            logo: LayoutDashboard,
            plan: "Bus company workspace",
        },
    ],
    navGroups: [
        {
            title: "Tổng quan",
            items: [
                {
                    title: "Dashboard",
                    url: busadminBasePath,
                    icon: LayoutDashboard,
                },
                {
                    title: "Nhà xe",
                    url: `${busadminBasePath}/company`,
                    icon: Building2,
                },
            ],
        },
        {
            title: "Vận hành",
            items: [
                {
                    title: "Xe",
                    url: `${busadminBasePath}/buses`,
                    icon: BusFront,
                },
                {
                    title: "Chuyến đi",
                    url: `${busadminBasePath}/trips`,
                    icon: CalendarRange,
                },
                {
                    title: "Vé",
                    url: `${busadminBasePath}/tickets`,
                    icon: Ticket,
                },
            ],
        },
    ],
};