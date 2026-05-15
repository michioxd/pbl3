import type { ProblemDetails } from "@/api";

export function parseApiErrorMessage(error: unknown, fallback: string) {
    if (!error) {
        return fallback;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "object") {
        const problem = error as ProblemDetails & { message?: string; error?: string };
        if (typeof problem.message === "string") {
            return problem.message;
        }
        if (typeof problem.error === "string") {
            return problem.error;
        }
        if (typeof problem.title === "string") {
            return problem.title;
        }
        if (typeof problem.detail === "string") {
            return problem.detail;
        }
    }

    return fallback;
}

export function formatCurrency(value?: number) {
    if (value === undefined) {
        return "--";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatDurationLabel(durationMinutes?: number) {
    if (durationMinutes === undefined || durationMinutes <= 0) {
        return "--";
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h${minutes}m`;
}
