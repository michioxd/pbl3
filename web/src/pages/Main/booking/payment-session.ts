export const MOMO_PENDING_PAYMENT_STORAGE_KEY = "booking_pending_momo_payment";

export type PendingMomoPayment = {
    intentId: string;
    bookingId?: string | null;
    orderId?: string | null;
    tripId?: string | null;
    createdAt: string;
};

function isBrowser() {
    return typeof window !== "undefined";
}

export function savePendingMomoPayment(payment: PendingMomoPayment) {
    if (!isBrowser()) {
        return;
    }

    window.sessionStorage.setItem(MOMO_PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(payment));
}

export function getPendingMomoPayment(): PendingMomoPayment | null {
    if (!isBrowser()) {
        return null;
    }

    const rawValue = window.sessionStorage.getItem(MOMO_PENDING_PAYMENT_STORAGE_KEY);
    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawValue) as Partial<PendingMomoPayment>;

        if (typeof parsed.intentId !== "string" || typeof parsed.createdAt !== "string") {
            return null;
        }

        return {
            intentId: parsed.intentId,
            bookingId: typeof parsed.bookingId === "string" ? parsed.bookingId : null,
            orderId: typeof parsed.orderId === "string" ? parsed.orderId : null,
            tripId: typeof parsed.tripId === "string" ? parsed.tripId : null,
            createdAt: parsed.createdAt,
        };
    } catch {
        return null;
    }
}

export function clearPendingMomoPayment() {
    if (!isBrowser()) {
        return;
    }

    window.sessionStorage.removeItem(MOMO_PENDING_PAYMENT_STORAGE_KEY);
}
