import type { BookingFormState, PaymentOption, StopOption } from "../types";
import { Badge, Card, Grid, Heading, Text } from "@radix-ui/themes";

type BookingConfirmStepProps = {
    form: BookingFormState;
    selectedPickup?: StopOption;
    selectedDropoff?: StopOption;
    selectedPayment?: PaymentOption;
    demoCompleted: boolean;
    title: string;
    description: string;
    contactTitle: string;
    routeTitle: string;
    addressNoteTitle: string;
    emptyNoteLabel: string;
    doneBadge: string;
    pendingBackendLabel: string;
    doneDescription: string;
};

export default function BookingConfirmStep({
    form,
    selectedPickup,
    selectedDropoff,
    selectedPayment,
    demoCompleted,
    title,
    description,
    contactTitle,
    routeTitle,
    addressNoteTitle,
    emptyNoteLabel,
    doneBadge,
    pendingBackendLabel,
    doneDescription,
}: BookingConfirmStepProps) {
    return (
        <>
            <Heading size="5" mb="2">
                {title}
            </Heading>
            <Text size="2" color="gray">
                {description}
            </Text>

            <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                <Card variant="surface" className="border border-(--gray-a4)">
                    <Text as="div" size="2" color="gray" mb="2">
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
                </Card>

                <Card variant="surface" className="border border-(--gray-a4)">
                    <Text as="div" size="2" color="gray" mb="2">
                        {routeTitle}
                    </Text>
                    <Text as="div" size="3" weight="bold">
                        {selectedPickup?.label || "--"}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {selectedDropoff?.label || "--"}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {selectedPayment?.title || "--"}
                    </Text>
                </Card>
            </Grid>

            <Card variant="surface" className="border border-(--gray-a4)">
                <Text as="div" size="2" color="gray" mb="2">
                    {addressNoteTitle}
                </Text>
                <Text as="div" size="2">
                    {form.addressNote.trim() || emptyNoteLabel}
                </Text>
            </Card>

            {demoCompleted ? (
                <Card className="border border-(--green-a6) bg-(--green-2)">
                    <Badge color="green" variant="soft" size="2" mb="2">
                        {doneBadge}
                    </Badge>
                    <Text as="div" size="3" weight="bold">
                        {pendingBackendLabel}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {doneDescription}
                    </Text>
                </Card>
            ) : null}
        </>
    );
}
