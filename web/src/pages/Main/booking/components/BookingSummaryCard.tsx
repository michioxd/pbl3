import type { BookingFormState, PaymentOption, StopOption } from "../types";
import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { CreditCard, MapPin } from "lucide-react";

type BookingSummaryCardProps = {
    title: string;
    tripTitle: string;
    contactTitle: string;
    paymentTitle: string;
    totalTitle: string;
    companyName: string;
    departureDateTimeLabel: string;
    routeLabel: string;
    totalPriceLabel: string;
    form: BookingFormState;
    selectedPickup?: StopOption;
    selectedDropoff?: StopOption;
    selectedPayment?: PaymentOption;
};

export default function BookingSummaryCard({
    title,
    tripTitle,
    contactTitle,
    paymentTitle,
    totalTitle,
    companyName,
    departureDateTimeLabel,
    routeLabel,
    totalPriceLabel,
    form,
    selectedPickup,
    selectedDropoff,
    selectedPayment,
}: BookingSummaryCardProps) {
    return (
        <Card size="2" variant="surface" className="lg:sticky lg:top-0">
            <Flex direction="column" gap="3">
                <Heading size="4">{title}</Heading>

                <Box className="rounded-lg bg-(--gray-3) p-4">
                    <Text as="div" size="2" color="gray" mb="1">
                        {tripTitle}
                    </Text>
                    <Text as="div" size="3" weight="bold">
                        {companyName}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {departureDateTimeLabel}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {routeLabel}
                    </Text>
                </Box>

                <Box className="rounded-lg bg-(--gray-3) p-4">
                    <Text as="div" size="2" color="gray" mb="1">
                        {contactTitle}
                    </Text>
                    <Text as="div" size="3" weight="bold">
                        {form.fullName || "--"}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {form.phoneNumber || "--"}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {form.email || "--"}
                    </Text>
                </Box>

                <Box className="rounded-lg bg-(--gray-3) p-4">
                    <Text as="div" size="2" color="gray" mb="1">
                        {paymentTitle}
                    </Text>
                    <Flex align="center" gap="2" mb="2">
                        <MapPin size={16} className="text-(--blue-9)" />
                        <Text as="div" size="2">
                            {selectedPickup?.label || "--"}
                        </Text>
                    </Flex>
                    <Flex align="center" gap="2" mb="2">
                        <MapPin size={16} className="text-(--blue-9)" />
                        <Text as="div" size="2">
                            {selectedDropoff?.label || "--"}
                        </Text>
                    </Flex>
                    <Flex align="center" gap="2">
                        <CreditCard size={16} className="text-(--blue-9)" />
                        <Text as="div" size="2">
                            {selectedPayment?.title || "--"}
                        </Text>
                    </Flex>
                </Box>

                <Box className="rounded-lg border border-dashed border-(--blue-a6) bg-(--blue-2) p-4">
                    <Text as="div" size="2" color="gray" mb="1">
                        {totalTitle}
                    </Text>
                    <Text as="div" size="6" weight="bold" color="blue">
                        {totalPriceLabel}
                    </Text>
                </Box>
            </Flex>
        </Card>
    );
}
