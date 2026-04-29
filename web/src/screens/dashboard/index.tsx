// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { Header } from "@/components/dashboard/layout/header";
import { Main } from "@/components/dashboard/layout/main";
// import { Main } from "@/components/dashboard/layout/main";
// import { TopNav } from "@/components/dashboard/layout/top-nav";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DirectionProvider } from "@/context/dashboard/direction-provider";
import { LayoutProvider } from "@/context/dashboard/layout-provider";
import { cn } from "@/lib/utils";
export function ScreenDashboard({ children, role = 0 }: { children: React.ReactNode; role: 0 | 1 }) {
    return (
        <>
            <LayoutProvider>
                <SidebarProvider>
                    <DirectionProvider>
                        <AppSidebar role={role} />
                        <SidebarInset
                            className={cn(
                                "@container/content",
                                "has-data-[layout=fixed]:h-svh",
                                "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]",
                            )}
                        >
                            <Header>
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
        </>
    );
}
