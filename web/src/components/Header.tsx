import { useThemeContext } from "@/controller/ThemeProvider";
import { useState } from "react";
import { Box, Flex, Container, Heading, Button, Link, IconButton, DropdownMenu } from "@radix-ui/themes";
import { BusFront, ContrastIcon, Menu, Moon, Sun, UserIcon } from "lucide-react";
import LinkRouter from "@/utils/LinkRouter";
import { LangSelectorComponent } from "./LangSelector";
import { useTranslation } from "react-i18next";
import LoginDialog from "@/dialogs/Login";
import { useStore } from "@/stores";
import useDialog from "@/shared/dialog/Dialog";
import { observer } from "mobx-react-lite";

const NAV_ITEMS = [
    { key: "nav.manageOrders", href: "#" },
    { key: "nav.openTicketSale", href: "#" },
    { key: "nav.becomePartner", href: "#" },
];

const MainHeader = observer(() => {
    const store = useStore();
    const dialog = useDialog();
    const { theme, toggleTheme } = useThemeContext();
    const { t } = useTranslation("header");
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const askLogoutConfirmation = () => {
        dialog.confirm({
            title: t("logout"),
            content: t("logout_confirmation"),
            onConfirm: () => store.user.logout(),
        });
    };

    return (
        <Box
            py="3"
            className="sticky top-0 z-50 bg-(--color-panel-solid)/90 backdrop-blur-xl border-b border-(--gray-a4)"
        >
            <Container size="4" px="4">
                <Flex justify="between" align="center">
                    <Flex align="center" gap="3" className="cursor-pointer">
                        <IconButton variant="soft" color="blue" size="3">
                            <BusFront size={24} />
                        </IconButton>
                        <Heading size="5" color="blue" weight="bold">
                            XeNhanh
                        </Heading>
                    </Flex>

                    <Flex align="center" gap="5" className="md:inline-flex! hidden!">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                asChild
                                key={item.key}
                                color="gray"
                                size="3"
                                weight="medium"
                                highContrast
                                className="no-underline!"
                            >
                                <LinkRouter to={item.href}>{t(item.key)}</LinkRouter>
                            </Link>
                        ))}
                    </Flex>

                    <Flex align="center" gap="3">
                        <LangSelectorComponent minimal />
                        <IconButton variant="soft" color="gray" size="2" onClick={toggleTheme}>
                            {theme === 1 ? (
                                <Sun size={18} />
                            ) : theme === 2 ? (
                                <Moon size={18} />
                            ) : (
                                <ContrastIcon size={18} />
                            )}
                        </IconButton>
                        {store.user.isAuthenticated ? (
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    <IconButton variant="soft" color="gray">
                                        <UserIcon size={24} />
                                    </IconButton>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Content size="2">
                                    <DropdownMenu.Item>
                                        {t("hello", { name: store.user.displayName })}
                                    </DropdownMenu.Item>
                                    {store.user.user?.role.roleName === "SysAdmin" && (
                                        <DropdownMenu.Item>Truy cập Admin</DropdownMenu.Item>
                                    )}
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item onSelect={askLogoutConfirmation}>
                                        {t("logout")}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        ) : (
                            <Button
                                variant="solid"
                                color="blue"
                                className="hidden md:inline-flex!"
                                onClick={() => setAuthDialogOpen(true)}
                                loading={store.user.isLoading}
                            >
                                {t("login")}
                            </Button>
                        )}
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <IconButton variant="ghost" color="gray" className="inline-flex! md:hidden!">
                                    <Menu size={24} />
                                </IconButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content size="2">
                                {NAV_ITEMS.map((item) => (
                                    <DropdownMenu.Item key={item.key} asChild>
                                        <LinkRouter to={item.href}>{t(item.key)}</LinkRouter>
                                    </DropdownMenu.Item>
                                ))}

                                <DropdownMenu.Separator />
                                {store.user.isAuthenticated ? (
                                    <DropdownMenu.Item onSelect={askLogoutConfirmation}>
                                        {t("logout")}
                                    </DropdownMenu.Item>
                                ) : (
                                    <DropdownMenu.Item onSelect={() => setAuthDialogOpen(true)}>
                                        {t("login")}
                                    </DropdownMenu.Item>
                                )}
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                        <LoginDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
                    </Flex>
                </Flex>
            </Container>
        </Box>
    );
});

export default MainHeader;
