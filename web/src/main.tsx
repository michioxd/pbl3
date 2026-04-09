import { createRoot } from "react-dom/client";
import "./main.css";
import App from "./App.tsx";
import ThemeProvider from "./controller/ThemeProvider.tsx";
import "@/locales/i18n";
import { configure } from "mobx";
import { BrowserRouter } from "react-router-dom";
import { client } from "./api/client.gen.ts";
import { GoogleOAuthProvider } from "@react-oauth/google";
import DialogProvider from "./shared/dialog/DialogProvider.tsx";

configure({
    enforceActions: "always",
});

client.setConfig({
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5026",
    fetch: async (url, options) => {
        const token = localStorage.getItem("auth_token");

        if (!token) return fetch(url, options);

        return fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
                Authorization: token ? `Bearer ${token}` : "",
            },
        });
    },
});

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ThemeProvider>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
                <DialogProvider>
                    <App />
                </DialogProvider>
            </GoogleOAuthProvider>
        </ThemeProvider>
    </BrowserRouter>,
);
