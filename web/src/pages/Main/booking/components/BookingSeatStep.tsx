import type { SeatOption, UpdateBookingField } from "../types";
import { Badge, Box, Flex, Heading, Text } from "@radix-ui/themes";

const SEAT_TYPE_LABELS: Record<number, string> = {
    0: "Cửa sổ",
    1: "Lối đi",
    2: "Giữa",
    3: "Tài xế",
    4: "Tầng trên",
    5: "Tầng dưới",
};

type BookingSeatStepProps = {
    seats: SeatOption[];
    selectedSeatLayoutId: string;
    updateField: UpdateBookingField;
    title: string;
    description: string;
    availableLabel: string;
    bookedLabel: string;
    selectedLabel: string;
    emptyLabel: string;
};

export default function BookingSeatStep({
    seats,
    selectedSeatLayoutId,
    updateField,
    title,
    description,
    availableLabel,
    bookedLabel,
    selectedLabel,
    emptyLabel,
}: BookingSeatStepProps) {
    const floors = [...new Set(seats.map((seat) => seat.floor || 1))].sort((a, b) => a - b);

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

            <Flex gap="3" wrap="wrap">
                <Flex align="center" gap="2">
                    <span className="h-3 w-3 rounded-full bg-(--green-8)" />
                    <Text size="2" color="gray">
                        {availableLabel}
                    </Text>
                </Flex>
                <Flex align="center" gap="2">
                    <span className="h-3 w-3 rounded-full bg-(--blue-9)" />
                    <Text size="2" color="gray">
                        {selectedLabel}
                    </Text>
                </Flex>
                <Flex align="center" gap="2">
                    <span className="h-3 w-3 rounded-full bg-(--gray-7)" />
                    <Text size="2" color="gray">
                        {bookedLabel}
                    </Text>
                </Flex>
            </Flex>

            {seats.length === 0 ? (
                <Box className="rounded-2xl border border-(--gray-a5) bg-(--gray-2) p-5 text-center">
                    <Text size="2" color="gray">
                        {emptyLabel}
                    </Text>
                </Box>
            ) : (
                <Flex direction="column" gap="4">
                    {floors.map((floor) => {
                        const floorSeats = seats.filter((seat) => (seat.floor || 1) === floor);
                        const columns = Math.max(...floorSeats.map((seat) => seat.positionX || 1));
                        const rows = Math.max(...floorSeats.map((seat) => seat.positionY || 1));

                        return (
                            <Box
                                key={floor}
                                className="rounded-3xl border border-(--gray-a5) bg-(--color-panel-solid) p-4"
                            >
                                <Flex justify="between" align="center" mb="4">
                                    <Text size="3" weight="bold">
                                        Tầng {floor}
                                    </Text>
                                    <Badge variant="soft" color="gray">
                                        {floorSeats.filter((seat) => seat.isAvailable).length}/{floorSeats.length}
                                    </Badge>
                                </Flex>

                                <div
                                    className="grid gap-3"
                                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(48px, 1fr))` }}
                                >
                                    {Array.from({ length: rows * columns }).map((_, index) => {
                                        const positionX = (index % columns) + 1;
                                        const positionY = Math.floor(index / columns) + 1;
                                        const seat = floorSeats.find(
                                            (item) => item.positionX === positionX && item.positionY === positionY,
                                        );

                                        if (!seat) {
                                            return <div key={`${floor}-${positionX}-${positionY}`} />;
                                        }

                                        const isSelected = selectedSeatLayoutId === seat.layoutId;
                                        const seatTypeLabel = SEAT_TYPE_LABELS[seat.seatType ?? -1] ?? "Ghế";

                                        return (
                                            <button
                                                key={seat.layoutId}
                                                type="button"
                                                disabled={!seat.isAvailable}
                                                onClick={() => updateField("selectedSeatLayoutId", seat.layoutId)}
                                                className={`min-h-16 rounded-2xl border px-2 py-3 text-center transition ${
                                                    isSelected
                                                        ? "border-(--blue-8) bg-(--blue-9) text-white shadow-sm"
                                                        : seat.isAvailable
                                                          ? "border-(--green-a6) bg-(--green-2) text-(--green-12) hover:border-(--blue-a8) hover:bg-(--blue-3)"
                                                          : "cursor-not-allowed border-(--gray-a5) bg-(--gray-4) text-(--gray-10) opacity-70"
                                                }`}
                                            >
                                                <Text as="div" size="3" weight="bold">
                                                    {seat.seatLabel}
                                                </Text>
                                                <Text
                                                    as="div"
                                                    size="1"
                                                    className={isSelected ? "text-white/80" : undefined}
                                                >
                                                    {seat.isAvailable ? seatTypeLabel : bookedLabel}
                                                </Text>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Box>
                        );
                    })}
                </Flex>
            )}
        </>
    );
}
