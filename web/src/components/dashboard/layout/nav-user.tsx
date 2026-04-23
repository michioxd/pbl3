import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useStore } from "@/stores";
import { getGravatarUrl } from "@/utils/gravatar";
import useDialog from "@/shared/dialog/Dialog";
import { useTranslation } from "react-i18next";

export function NavUser() {
    const { t } = useTranslation("header");
    const dialog = useDialog();
    const store = useStore();
    const { isMobile } = useSidebar();

    const askLogoutConfirmation = () => {
        dialog.confirm({
            title: t("logout"),
            content: t("logout_confirmation"),
            onConfirm: () => store.user.logout(),
        });
    };

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={getGravatarUrl(store.user.user?.email || "")}
                                        alt={store.user.displayName}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {store.user.displayName
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-start text-sm leading-tight">
                                    <span className="truncate font-semibold">{store.user.displayName}</span>
                                    <span className="truncate text-xs">{store.user.user?.email}</span>
                                </div>
                                <ChevronsUpDown className="ms-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage
                                            src={getGravatarUrl(store.user.user?.email || "")}
                                            alt={store.user.displayName}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {store.user.displayName
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-start text-sm leading-tight">
                                        <span className="truncate font-semibold">{store.user.displayName}</span>
                                        <span className="truncate text-xs">{store.user.user?.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={askLogoutConfirmation}>
                                <LogOut />
                                Đăng xuất
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}
