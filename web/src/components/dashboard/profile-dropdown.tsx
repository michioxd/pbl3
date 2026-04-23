import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/stores";
import { getGravatarUrl } from "@/utils/gravatar";
import useDialog from "@/shared/dialog/Dialog";
import { useTranslation } from "react-i18next";

export function ProfileDropdown() {
    const store = useStore();
    const dialog = useDialog();
    const { t } = useTranslation("header");
    const askLogoutConfirmation = () => {
        dialog.confirm({
            title: t("logout"),
            content: t("logout_confirmation"),
            onConfirm: () => store.user.logout(),
        });
    };
    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={getGravatarUrl(store.user.user?.email || "")}
                                alt={store.user?.displayName}
                            />
                            <AvatarFallback>{store.user?.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-sm leading-none font-medium">{store.user.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{store.user.user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={askLogoutConfirmation}>
                        Đăng xuất
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
