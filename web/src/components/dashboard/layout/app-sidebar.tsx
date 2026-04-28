import { useLayout } from "@/context/dashboard/layout-provider";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { AppTitle } from "./app-title";
import { adminSidebarData, busAdminSidebarData } from "./data/sidebar-data";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { BusIcon } from "lucide-react";
// import { TeamSwitcher } from "./team-switcher";

export function AppSidebar({ role = 0 }: { role: 0 | 1 }) {
    const { collapsible, variant } = useLayout();
    return (
        <Sidebar collapsible={collapsible} variant={variant}>
            <SidebarHeader>
                {role === 1 ? (
                    <TeamSwitcher
                        teams={[
                            {
                                name: "Bus Admin",
                                logo: BusIcon,
                                plan: "bus-admin",
                            },
                        ]}
                    />
                ) : (
                    <AppTitle />
                )}
            </SidebarHeader>
            <SidebarContent>
                {(role === 1 ? busAdminSidebarData : adminSidebarData).navGroups.map((props) => (
                    <NavGroup key={props.title} {...props} />
                ))}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
