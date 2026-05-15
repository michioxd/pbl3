import type { BookingFormState, PaymentOption, UpdateBookingField } from "../types";
import { Badge, Box, Grid, Heading, Text } from "@radix-ui/themes";

type BookingPaymentStepProps = {
    paymentOptions: PaymentOption[];
    paymentProvider: BookingFormState["paymentProvider"];
    updateField: UpdateBookingField;
    title: string;
    description: string;
    noteTitle: string;
    noteDescription: string;
};

export default function BookingPaymentStep({
    paymentOptions,
    paymentProvider,
    updateField,
    title,
    description,
}: BookingPaymentStepProps) {
    return (
        <>
            <Box>
                <Heading size="5" mb="2">
                    {title}
                </Heading>
                <Text size="2" color="gray">
                    {description}
                </Text>
            </Box>

            <Grid columns={{ initial: "1", sm: "3" }} gap="4">
                {paymentOptions.map((option) => {
                    const isSelected = paymentProvider === option.value;
                    const Icon = option.Icon;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField("paymentProvider", option.value)}
                            className={`rounded-2xl border p-4 text-left transition ${
                                isSelected
                                    ? "border-(--blue-8) bg-(--blue-3) shadow-sm"
                                    : "border-(--gray-a5) bg-(--color-panel-solid) hover:border-(--blue-a7)"
                            }`}
                        >
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--gray-a3) text-(--blue-9)">
                                    <Icon size={20} />
                                </div>
                                <Badge color={isSelected ? "blue" : "gray"} variant="soft">
                                    {option.badge}
                                </Badge>
                            </div>
                            <Text as="div" size="3" weight="bold" mb="1">
                                {option.title}
                            </Text>
                            <Text as="div" size="2" color="gray">
                                {option.description}
                            </Text>
                        </button>
                    );
                })}
            </Grid>
        </>
    );
}
