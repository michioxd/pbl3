import { Theme } from "@radix-ui/themes";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";

const themeLocalKey = "APP_THEME";

const ThemeContext = createContext<{
    theme: 0 | 1 | 2;
    setTheme: (value: 0 | 1 | 2) => void;
    mode: 0 | 1;
    toggleTheme: () => void;
}>({
    theme: 0,
    mode: 0,
    setTheme: () => {},
    toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<0 | 1 | 2>(() => {
        const stored = localStorage.getItem(themeLocalKey);
        if (stored === "1") return 1;
        if (stored === "2") return 2;
        return 0;
    });

    const [systemPrefersDark, setSystemPrefersDark] = useState(
        () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    const mode: 0 | 1 = useMemo(
        () => (theme === 0 ? (systemPrefersDark ? 1 : 0) : theme === 1 ? 1 : 0),
        [theme, systemPrefersDark],
    );

    const toggleTheme = useCallback(() => {
        setTheme((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, []);

    useEffect(() => {
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemPrefersDark(e.matches);
        };
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        if (theme === 0) {
            mediaQuery.addEventListener("change", handleChange);
        }
        localStorage.setItem(themeLocalKey, theme.toString());

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, [theme]);

    useEffect(() => {
        if (mode === 1) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [mode]);

    return (
        <>
            <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mode }}>
                <Theme appearance={mode === 1 ? "dark" : "light"} accentColor="blue">
                    <Toaster
                        position="bottom-right"
                        richColors
                        duration={5000}
                        theme={mode === 1 ? "dark" : "light"}
                        className="toast"
                        style={
                            {
                                "--toast-bg": "var(--color-panel-solid)",
                                "--toast-border": "var(--gray-a5)",
                                "--toast-text": "var(--gray-12)",
                                "--toast-success-bg": "var(--green-3)",
                                "--toast-success-border": "var(--green-5)",
                                "--toast-success-text": "var(--green-11)",
                                "--toast-error-bg": "var(--red-3)",
                                "--toast-error-border": "var(--red-5)",
                                "--toast-error-text": "var(--red-11)",
                            } as React.CSSProperties
                        }
                    />
                    {children}
                </Theme>
            </ThemeContext.Provider>
        </>
    );
}

const useThemeContext = () => {
    return useContext(ThemeContext);
};

// eslint-disable-next-line react-refresh/only-export-components
export { ThemeContext, useThemeContext };
