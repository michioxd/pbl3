import {
    LayoutDashboard,
    Package,
    Users,
    AudioWaveform,
    Command,
    GalleryVerticalEnd,
    ClockIcon,
    Building2Icon,
} from "lucide-react";
import { type SidebarData } from "../types";

const adminBasePath = "/admin";
const busAdminBasePath = "/busadmin";

export const adminSidebarData: SidebarData = {
    teams: [
        {
            name: "Shadcn Admin",
            logo: Command,
            plan: "Vite + ShadcnUI",
        },
        {
            name: "Acme Inc",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: AudioWaveform,
            plan: "Startup",
        },
    ],
    navGroups: [
        {
            title: "Hệ thống",
            items: [
                {
                    title: "Tổng quan",
                    url: adminBasePath,
                    icon: LayoutDashboard,
                },
                {
                    title: "Người dùng",
                    url: `${adminBasePath}/users`,
                    icon: Users,
                },
                {
                    title: "Yêu cầu nâng cấp",
                    url: `${adminBasePath}/upgrade-requests`,
                    badge: "5",
                    icon: Package,
                },
            ],
        },
        {
            title: "Tài chính",
            items: [
                {
                    title: "Lịch sử giao dịch",
                    url: `${adminBasePath}/finance/transactions`,
                    icon: ClockIcon,
                },
            ],
        },
        {
            title: "Đối tác",
            items: [
                {
                    title: "Công ty",
                    icon: Building2Icon,
                    url: `${adminBasePath}/affiliates/companies`,
                },
            ],
        },
    ],
};

export const busAdminSidebarData: SidebarData = {
    teams: [
        {
            name: "Shadcn Admin",
            logo: Command,
            plan: "Vite + ShadcnUI",
        },
        {
            name: "Acme Inc",
            logo: GalleryVerticalEnd,
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: AudioWaveform,
            plan: "Startup",
        },
    ],
    // TODO: add more items for bus admin
    navGroups: [
        {
            title: "Hệ thống",
            items: [
                {
                    title: "Tổng quan",
                    url: busAdminBasePath,
                    icon: LayoutDashboard,
                },
            ],
        },
    ],
};
