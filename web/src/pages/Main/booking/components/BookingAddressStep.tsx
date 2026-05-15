import type { BookingFormState, StopOption, UpdateBookingField } from "../types";
import { Box, Grid, Heading, Select, Text, TextArea, TextField } from "@radix-ui/themes";

type BookingAddressStepProps = {
    form: BookingFormState;
    pickupOptions: StopOption[];
    dropoffOptions: StopOption[];
    updateField: UpdateBookingField;
    title: string;
    description: string;
    fullNameLabel: string;
    phoneLabel: string;
    emailLabel: string;
    pickupLabel: string;
    dropoffLabel: string;
    noteLabel: string;
    notePlaceholder: string;
    stopNotAvailable: string;
};

const selectTriggerClassName =
    "w-full! rounded-xl border border-(--gray-a6) bg-(--color-panel-solid) px-3 py-2.5 text-sm outline-none transition focus:border-(--blue-8) focus:ring-2 focus:ring-(--blue-a4)";

export default function BookingAddressStep({
    form,
    pickupOptions,
    dropoffOptions,
    updateField,
    title,
    description,
    fullNameLabel,
    phoneLabel,
    emailLabel,
    pickupLabel,
    dropoffLabel,
    noteLabel,
    notePlaceholder,
    stopNotAvailable,
}: BookingAddressStepProps) {
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

            <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                <Box>
                    <Text as="label" size="2" weight="medium" mb="2" className="block">
                        {fullNameLabel}
                    </Text>
                    <TextField.Root
                        value={form.fullName}
                        onChange={(event) => updateField("fullName", event.target.value)}
                        placeholder={fullNameLabel}
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="medium" mb="2" className="block">
                        {phoneLabel}
                    </Text>
                    <TextField.Root
                        value={form.phoneNumber}
                        onChange={(event) => updateField("phoneNumber", event.target.value)}
                        placeholder={phoneLabel}
                    />
                </Box>
                <Box style={{ gridColumn: "1 / -1" }}>
                    <Text as="label" size="2" weight="medium" mb="2" className="block">
                        {emailLabel}
                    </Text>
                    <TextField.Root
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        placeholder={emailLabel}
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="medium" mb="2" className="block">
                        {pickupLabel}
                    </Text>
                    <Select.Root
                        value={form.pickupStopId || undefined}
                        onValueChange={(value) => updateField("pickupStopId", value)}
                        disabled={!pickupOptions.length}
                    >
                        <Select.Trigger className={selectTriggerClassName} placeholder={stopNotAvailable} />
                        <Select.Content variant="soft" className="w-full">
                            {pickupOptions.length ? (
                                <Select.Group>
                                    {pickupOptions.map((option) => (
                                        <Select.Item key={option.value} value={option.value}>
                                            {option.label}
                                            {option.secondary ? ` - ${option.secondary}` : ""}
                                        </Select.Item>
                                    ))}
                                </Select.Group>
                            ) : (
                                <Select.Group>
                                    <Select.Item value="unavailable" disabled>
                                        {stopNotAvailable}
                                    </Select.Item>
                                </Select.Group>
                            )}
                        </Select.Content>
                    </Select.Root>
                </Box>
                <Box>
                    <Text as="label" size="2" weight="medium" mb="2" className="block">
                        {dropoffLabel}
                    </Text>
                    <Select.Root
                        value={form.dropoffStopId || undefined}
                        onValueChange={(value) => updateField("dropoffStopId", value)}
                        disabled={!dropoffOptions.length}
                    >
                        <Select.Trigger className={selectTriggerClassName} placeholder={stopNotAvailable} />
                        <Select.Content variant="soft" className="w-full">
                            {dropoffOptions.length ? (
                                <Select.Group>
                                    {dropoffOptions.map((option) => (
                                        <Select.Item key={option.value} value={option.value}>
                                            {option.label}
                                            {option.secondary ? ` - ${option.secondary}` : ""}
                                        </Select.Item>
                                    ))}
                                </Select.Group>
                            ) : (
                                <Select.Group>
                                    <Select.Item value="unavailable" disabled>
                                        {stopNotAvailable}
                                    </Select.Item>
                                </Select.Group>
                            )}
                        </Select.Content>
                    </Select.Root>
                </Box>
            </Grid>

            <Box>
                <Text as="label" size="2" weight="medium" mb="2" className="block">
                    {noteLabel}
                </Text>
                <TextArea
                    value={form.addressNote}
                    onChange={(event) => updateField("addressNote", event.target.value)}
                    placeholder={notePlaceholder}
                    className="w-full"
                />
            </Box>
        </>
    );
}
