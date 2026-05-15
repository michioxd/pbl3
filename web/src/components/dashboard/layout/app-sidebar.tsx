import { useLayout } from "@/context/dashboard/layout-provider";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { useStore } from "@/stores";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { AppTitle } from "./app-title";
import { busAdminSidebarData, getAdminSidebarData } from "./data/sidebar-data";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import { BusIcon } from "lucide-react";

export const AppSidebar = observer(({ role = 0 }: { role: 0 | 1 }) => {
    const { collapsible, variant } = useLayout();
    const { user } = useStore();

    useEffect(() => {
        if (role === 0 && user.user?.role.roleName === "SysAdmin") {
            void user.fetchPendingUpgradeRequestCount();

            const interval = setInterval(() => {
                void user.fetchPendingUpgradeRequestCount();
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [role, user, user.user?.role.roleName]);

    const sidebarData = role === 1 ? busAdminSidebarData : getAdminSidebarData(user.pendingUpgradeRequestCount);

    return (
        <Sidebar collapsible={collapsible} variant={variant}>
            <SidebarHeader>
                {role === 1 ? (
                    <TeamSwitcher
                        // TODO: a member should be only in one team (company) in this system
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
                {sidebarData.navGroups.map((props) => (
                    <NavGroup key={props.title} {...props} />
                ))}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
});
