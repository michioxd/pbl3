import { AppSidebarBusAdmin } from "@/components/dashboard/layout/app-sidebar-busadmin";
import { Header } from "@/components/dashboard/layout/header";
import { Main } from "@/components/dashboard/layout/main";
import { TopNav } from "@/components/dashboard/layout/top-nav";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DirectionProvider } from "@/context/dashboard/direction-provider";
import { LayoutProvider } from "@/context/dashboard/layout-provider";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

export function ScreenBusDashboard({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const topNav = [
        {
            title: "Tổng quan",
            href: "/busadmin",
            isActive: location.pathname === "/busadmin",
            disabled: false,
        },
        {
            title: "Nhà xe",
            href: "/busadmin/company",
            isActive: location.pathname.startsWith("/busadmin/company"),
            disabled: false,
        },
        {
            title: "Xe",
            href: "/busadmin/buses",
            isActive: location.pathname.startsWith("/busadmin/buses"),
            disabled: false,
        },
        {
            title: "Chuyến đi",
            href: "/busadmin/trips",
            isActive: location.pathname.startsWith("/busadmin/trips"),
            disabled: false,
        },
        {
            title: "Vé",
            href: "/busadmin/tickets",
            isActive: location.pathname.startsWith("/busadmin/tickets"),
            disabled: false,
        },
    ];

    return (
        <LayoutProvider>
            <SidebarProvider>
                <DirectionProvider>
                    <AppSidebarBusAdmin />
                    <SidebarInset
                        className={cn(
                            "@container/content",
                            "has-data-[layout=fixed]:h-svh",
                            "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]",
                        )}
                    >
                        <Header>
                            <TopNav links={topNav} />
                            <div className="ms-auto flex items-center space-x-4">
                                <ThemeSwitch />
                                <ProfileDropdown />
                            </div>
                        </Header>
                        <Main>{children}</Main>
                    </SidebarInset>
                </DirectionProvider>
            </SidebarProvider>
        </LayoutProvider>
    );
}