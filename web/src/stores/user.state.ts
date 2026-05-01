import { getApiUserMe, type MePassengerDto, type MeUserInfoDto, type MeUserRoleDto } from "@/api";
import { makeAutoObservable, runInAction } from "mobx";

export type ICurrentUser = {
    id: string;
    email: string;
    role: MeUserRoleDto;
    currentUser: MeUserInfoDto;
    currentPassenger: MePassengerDto;
};

export class UserStore {
    user: ICurrentUser | null = null;
    userToken: string | null = null;
    isLoading: boolean = true;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isAuthenticated() {
        return !!this.user;
    }

    get displayName() {
        if (!this.user) return "common:guest";
        if (!this.user.currentUser?.fullName) return this.user.email;
        return this.user.currentUser.fullName || "";
    }

    get displayRole() {
        if (!this.user) return "common:guest";
        return (
            String(this.user.currentUser.role?.roleName).charAt(0).toUpperCase() +
            String(this.user.currentUser.role?.roleName).slice(1).toLowerCase()
        );
    }

    async checkAuth(): Promise<boolean> {
        console.log("Checking auth...");
        if (localStorage.getItem("auth_token") === null) {
            runInAction(() => {
                this.isLoading = false;
                this.user = null;
            });
            return false;
        }
        this.isLoading = true;
        this.error = null;

        try {
            const f = await getApiUserMe();

            if (!f.data?.user) {
                console.error("[user.checkAuth] check failed: No user data", f.data);
                this.user = null;
                this.error = "common:unauthorized";
                runInAction(() => this.logout());
                return false;
            }

            const roleName = String(f.data.user.role?.roleName || "").toLowerCase();
            const requiresPassengerProfile = roleName === "passenger";

            if (requiresPassengerProfile && !f.data.passenger) {
                console.error("[user.checkAuth] check failed: Missing passenger profile", f.data);
                this.user = null;
                this.error = "common:unauthorized";
                runInAction(() => this.logout());
                return false;
            }

            return (
                runInAction(() => {
                    if (!f.data?.user) return;
                    this.user = {
                        id: f.data.user.userID || "",
                        email: f.data.user.email || "",
                        role: f.data.user.role || { roleID: "", roleName: "" },
                        currentUser: f.data.user,
                        currentPassenger: f.data.passenger || ({} as MePassengerDto),
                    };
                    this.error = null;
                    this.userToken = localStorage.getItem("auth_token");
                    console.log("[user.checkAuth] User authenticated:", this.user);
                    return true;
                }) || false
            );
        } catch (e: any) {
            console.error("[user.checkAuth] Auth check failed", e);
            localStorage.removeItem("auth_token");
            runInAction(() => {
                this.user = null;
                this.error = e.message || "common:unknown_error";
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async login(token: string): Promise<boolean> {
        this.logout();
        localStorage.setItem("auth_token", token);
        return await this.checkAuth();
    }

    async logout() {
        localStorage.removeItem("auth_token");
        runInAction(() => {
            this.user = null;
        });
    }
}
