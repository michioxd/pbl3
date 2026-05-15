import type { PaymentProvider, TripDetailRouteStopDto } from "@/api";
import type { LucideIcon } from "lucide-react";

export type BookingStep = 0 | 1 | 2;

export type BookingFormState = {
    fullName: string;
    phoneNumber: string;
    email: string;
    pickupStopId: string;
    dropoffStopId: string;
    addressNote: string;
    paymentProvider: PaymentProvider;
};

export type StopOption = {
    value: string;
    label: string;
    secondary: string;
    stop: TripDetailRouteStopDto;
};

export type PaymentOption = {
    value: PaymentProvider;
    title: string;
    description: string;
    badge: string;
    Icon: LucideIcon;
};

export type StepItem = {
    value: BookingStep;
    label: string;
};

export type UpdateBookingField = <K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) => void;
