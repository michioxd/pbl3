import { Badge, Box, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";

type BookingTripCardProps = {
    title: string;
    companyName: string;
    routeLabel: string;
    priceLabel: string;
    departureTitle: string;
    arrivalTitle: string;
    durationTitle: string;
    availableLabel: string;
    departureTimeLabel: string;
    departureStopLabel: string;
    arrivalTimeLabel: string;
    arrivalStopLabel: string;
    durationLabel: string;
};

export default function BookingTripCard({
    title,
    companyName,
    routeLabel,
    priceLabel,
    departureTitle,
    arrivalTitle,
    durationTitle,
    availableLabel,
    departureTimeLabel,
    departureStopLabel,
    arrivalTimeLabel,
    arrivalStopLabel,
    durationLabel,
}: BookingTripCardProps) {
    return (
        <Card size="3" variant="surface" className="overflow-hidden">
            <Flex direction="column" gap="4">
                <Flex justify="between" align={{ initial: "start", sm: "center" }} gap="3" wrap="wrap">
                    <Box>
                        <Text size="2" color="gray" mb="1" as="div">
                            {title}
                        </Text>
                        <Heading size="5">{companyName}</Heading>
                        <Text size="2" color="gray" mt="1">
                            {routeLabel}
                        </Text>
                    </Box>
                    <Badge color="blue" size="2" variant="soft">
                        {priceLabel}
                    </Badge>
                </Flex>

                <Grid columns={{ initial: "1", sm: "3" }} gap="4">
                    <Box className="rounded-2xl bg-(--gray-3) p-4">
                        <Text size="2" color="gray" mb="1" as="div">
                            {departureTitle}
                        </Text>
                        <Text size="4" weight="bold" as="div">
                            {departureTimeLabel}
                        </Text>
                        <Text size="2" color="gray">
                            {departureStopLabel}
                        </Text>
                    </Box>
                    <Box className="rounded-2xl bg-(--gray-3) p-4">
                        <Text size="2" color="gray" mb="1" as="div">
                            {arrivalTitle}
                        </Text>
                        <Text size="4" weight="bold" as="div">
                            {arrivalTimeLabel}
                        </Text>
                        <Text size="2" color="gray">
                            {arrivalStopLabel}
                        </Text>
                    </Box>
                    <Box className="rounded-2xl bg-(--gray-3) p-4">
                        <Text size="2" color="gray" mb="1" as="div">
                            {durationTitle}
                        </Text>
                        <Text size="4" weight="bold" as="div">
                            {durationLabel}
                        </Text>
                        <Text size="2" color="gray">
                            {availableLabel}
                        </Text>
                    </Box>
                </Grid>
            </Flex>
        </Card>
    );
}
