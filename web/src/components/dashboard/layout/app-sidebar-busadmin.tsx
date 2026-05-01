import { useLayout } from "@/context/dashboard/layout-provider";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { AppTitleBusAdmin } from "./app-title-busadmin";
import { busadminSidebarData } from "./data/busadmin-sidebar-data";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";

export function AppSidebarBusAdmin() {
    const { collapsible, variant } = useLayout();

    return (
        <Sidebar collapsible={collapsible} variant={variant}>
            <SidebarHeader>
                <AppTitleBusAdmin />
            </SidebarHeader>
            <SidebarContent>
                {busadminSidebarData.navGroups.map((props) => (
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