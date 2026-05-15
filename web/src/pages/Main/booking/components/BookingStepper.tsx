import { CheckIcon } from "lucide-react";
import type { BookingStep, StepItem } from "../types";
import { Box, Flex, Grid, Text } from "@radix-ui/themes";

type BookingStepperProps = {
    stepItems: StepItem[];
    currentStep: BookingStep;
    stepLabel: (index: number) => string;
};

export default function BookingStepper({ stepItems, currentStep, stepLabel }: BookingStepperProps) {
    return (
        <Grid columns={{ initial: "1", sm: "3" }} gap="3">
            {stepItems.map((step, index) => {
                const isActive = currentStep === step.value;
                const isCompleted = currentStep > step.value;

                return (
                    <Box
                        key={step.value}
                        className={`rounded-lg border p-4 transition ${
                            isActive
                                ? "border-(--blue-8) bg-(--blue-2)"
                                : isCompleted
                                  ? "border-(--green-a6) bg-(--green-2)"
                                  : "border-(--gray-a5) bg-(--color-panel-solid)"
                        }`}
                    >
                        <Flex align="center" gap="3">
                            <Box
                                className={`flex! h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                                    isActive
                                        ? "border-(--blue-8) bg-(--blue-9) text-white"
                                        : isCompleted
                                          ? "border-(--green-8) bg-(--green-9) text-white"
                                          : "border-(--gray-a6) bg-(--gray-3) text-(--gray-11)"
                                }`}
                            >
                                {isCompleted ? <CheckIcon size={24} /> : index + 1}
                            </Box>
                            <Box>
                                <Text size="2" color="gray" as="div">
                                    {stepLabel(index + 1)}
                                </Text>
                                <Text size="3" weight="bold" as="div">
                                    {step.label}
                                </Text>
                            </Box>
                        </Flex>
                    </Box>
                );
            })}
        </Grid>
    );
}
