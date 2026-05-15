import { Box, Button, Card, Flex, Text } from "@radix-ui/themes";

type BookingLoginPromptProps = {
    title: string;
    description: string;
    actionLabel: string;
    onOpenLogin: () => void;
};

export default function BookingLoginPrompt({ title, description, actionLabel, onOpenLogin }: BookingLoginPromptProps) {
    return (
        <Card className="border border-(--amber-a6) bg-(--amber-2)">
            <Flex justify="between" align={{ initial: "start", sm: "center" }} gap="3" wrap="wrap">
                <Box>
                    <Text as="div" size="3" weight="bold" mb="1">
                        {title}
                    </Text>
                    <Text as="div" size="2" color="gray">
                        {description}
                    </Text>
                </Box>
                <Button color="amber" onClick={onOpenLogin}>
                    {actionLabel}
                </Button>
            </Flex>
        </Card>
    );
}
