import { getApiTripsByTripId } from "@/api";
import type { TripDetailDto } from "@/api";
import AmenityIcon from "./AmenityIcon";
import {
    Badge,
    Box,
    Button,
    Card,
    Dialog,
    Flex,
    Grid,
    Heading,
    ScrollArea,
    Separator,
    Skeleton,
    Tabs,
    Text,
} from "@radix-ui/themes";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, MapPin, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface TripDetailDialogProps {
    tripId: string | null;
    onClose: () => void;
}

export default function TripDetailDialog({ tripId, onClose }: TripDetailDialogProps) {
    const { t } = useTranslation();
    const [trip, setTrip] = useState<TripDetailDto | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tripId) {
            return;
        }

        let active = true;

        const fetchTripDetail = async () => {
            setLoading(true);
            setTrip(null);

            try {
                const response = await getApiTripsByTripId({ path: { tripId } });
                if (!active) {
                    return;
                }

                if (response.data) {
                    setTrip(response.data);
                } else {
                    setTrip(null);
                    console.error("Failed to fetch trip detail");
                }
            } catch (error) {
                if (!active) {
                    return;
                }

                setTrip(null);
                console.error("Error fetching trip detail:", error);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void fetchTripDetail();

        return () => {
            active = false;
        };
    }, [tripId]);

    const formatTime = (dateTime?: string) => {
        if (!dateTime) {
            return "--";
        }

        return format(new Date(dateTime), "HH:mm");
    };

    const formatDate = (date?: string) => {
        if (!date) {
            return "--";
        }

        return format(new Date(date), "EEEE, dd/MM/yyyy", { locale: vi });
    };

    const formatDuration = (minutes?: number) => {
        if (minutes === undefined) {
            return "--";
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
    };

    const formatPrice = (price?: number) => {
        if (price === undefined) {
            return "--";
        }

        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    return (
        <Dialog.Root open={!!tripId} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Content maxWidth="900px" style={{ maxHeight: "90vh", padding: 0, overflow: "hidden" }}>
                <Flex direction="column" style={{ height: "90vh" }}>
                    <Flex
                        justify="between"
                        align="center"
                        p="4"
                        style={{
                            borderBottom: "1px solid var(--gray-a4)",
                            flexShrink: 0,
                        }}
                    >
                        <Heading size="5">{t("trip:detail_title")}</Heading>
                        <Dialog.Close>
                            <Button variant="ghost" size="2">
                                <X size={18} />
                            </Button>
                        </Dialog.Close>
                    </Flex>

                    <ScrollArea style={{ flex: 1 }}>
                        <Box p="4">
                            {loading ? (
                                <Flex direction="column" gap="4">
                                    <Skeleton height="200px" />
                                    <Skeleton height="100px" />
                                    <Skeleton height="150px" />
                                </Flex>
                            ) : trip ? (
                                <Flex direction="column" gap="4">
                                    {(() => {
                                        const pickupStops = trip.pickupStops ?? [];
                                        const dropoffStops = trip.dropoffStops ?? [];
                                        const amenities = trip.amenities ?? [];
                                        const images = trip.images ?? [];
                                        const firstPickupStop = pickupStops[0];
                                        const lastDropoffStop = dropoffStops[dropoffStops.length - 1];
                                        const rating = trip.rating ?? 0;
                                        const reviewCount = trip.reviewCount ?? 0;

                                        return (
                                            <>
                                                <Box>
                                                    <Flex align="center" gap="2" mb="2">
                                                        <Heading size="6">{trip.busCompanyName ?? "--"}</Heading>
                                                        <Badge color="green" size="2" variant="soft">
                                                            <Star size={12} className="inline mr-1" />
                                                            {rating.toFixed(1)} ({reviewCount})
                                                        </Badge>
                                                    </Flex>
                                                    <Text size="2" color="gray">
                                                        {trip.routeName ?? "--"} • {trip.busTypeName ?? "--"}
                                                    </Text>
                                                </Box>

                                                <Card>
                                                    <Grid columns="3" gap="4" align="center">
                                                        <Flex direction="column">
                                                            <Text size="5" weight="bold" mb="1">
                                                                {formatTime(trip.departureTime)}
                                                            </Text>
                                                            <Text size="2" color="gray">
                                                                {firstPickupStop?.stationName ?? "--"}
                                                            </Text>
                                                        </Flex>

                                                        <Flex direction="column" align="center">
                                                            <Text size="1" color="gray" mb="1">
                                                                {formatDuration(trip.durationMinutes)}
                                                            </Text>
                                                            <Box
                                                                style={{
                                                                    width: "100%",
                                                                    height: "2px",
                                                                    background: "var(--gray-a6)",
                                                                }}
                                                            />
                                                            <Text size="1" color="gray" mt="1">
                                                                {formatDate(trip.departureDate)}
                                                            </Text>
                                                        </Flex>

                                                        <Flex direction="column" align="end">
                                                            <Text size="5" weight="bold" mb="1">
                                                                {formatTime(trip.arrivalTime)}
                                                            </Text>
                                                            <Text size="2" color="gray" align="right">
                                                                {lastDropoffStop?.stationName ?? "--"}
                                                            </Text>
                                                        </Flex>
                                                    </Grid>

                                                    <Separator size="4" my="3" />

                                                    <Flex justify="between" align="center">
                                                        <Flex gap="4">
                                                            <Text size="2" color="gray">
                                                                {trip.availableSeats ?? 0}/{trip.totalSeats ?? 0} chỗ
                                                                trống
                                                            </Text>
                                                        </Flex>
                                                        <Text size="5" weight="bold" color="blue">
                                                            {formatPrice(trip.lowestPrice)}
                                                        </Text>
                                                    </Flex>
                                                </Card>

                                                <Tabs.Root defaultValue="pickup">
                                                    <Tabs.List>
                                                        <Tabs.Trigger value="pickup">Điểm đón</Tabs.Trigger>
                                                        <Tabs.Trigger value="dropoff">Điểm trả</Tabs.Trigger>
                                                        <Tabs.Trigger value="reviews">Đánh giá</Tabs.Trigger>
                                                        <Tabs.Trigger value="policy">Chính sách</Tabs.Trigger>
                                                        <Tabs.Trigger value="amenities">Tiện ích</Tabs.Trigger>
                                                        {images.length > 0 && (
                                                            <Tabs.Trigger value="images">Hình ảnh</Tabs.Trigger>
                                                        )}
                                                    </Tabs.List>

                                                    <Box pt="3">
                                                        <Tabs.Content value="pickup">
                                                            <Flex direction="column" gap="3">
                                                                {pickupStops.map((stop) => (
                                                                    <Card
                                                                        key={
                                                                            stop.stationId ??
                                                                            `${stop.stopOrder ?? 0}-${stop.stationName ?? "pickup"}`
                                                                        }
                                                                    >
                                                                        <Flex gap="3">
                                                                            <Box
                                                                                style={{
                                                                                    width: "32px",
                                                                                    height: "32px",
                                                                                    borderRadius: "50%",
                                                                                    background: "var(--blue-a3)",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    flexShrink: 0,
                                                                                }}
                                                                            >
                                                                                <MapPin size={16} />
                                                                            </Box>
                                                                            <Flex direction="column" gap="1">
                                                                                <Text size="3" weight="medium">
                                                                                    {stop.stationName}
                                                                                </Text>
                                                                                {stop.addressDetail && (
                                                                                    <Text size="2" color="gray">
                                                                                        {stop.addressDetail}
                                                                                    </Text>
                                                                                )}
                                                                                {(stop.durationFromStart ?? 0) > 0 && (
                                                                                    <Flex align="center" gap="1">
                                                                                        <Clock size={12} />
                                                                                        <Text size="1" color="gray">
                                                                                            +
                                                                                            {formatDuration(
                                                                                                stop.durationFromStart,
                                                                                            )}{" "}
                                                                                            từ điểm xuất phát
                                                                                        </Text>
                                                                                    </Flex>
                                                                                )}
                                                                            </Flex>
                                                                        </Flex>
                                                                    </Card>
                                                                ))}
                                                            </Flex>
                                                        </Tabs.Content>

                                                        <Tabs.Content value="dropoff">
                                                            <Flex direction="column" gap="3">
                                                                {dropoffStops.map((stop) => (
                                                                    <Card
                                                                        key={
                                                                            stop.stationId ??
                                                                            `${stop.stopOrder ?? 0}-${stop.stationName ?? "dropoff"}`
                                                                        }
                                                                    >
                                                                        <Flex gap="3">
                                                                            <Box
                                                                                style={{
                                                                                    width: "32px",
                                                                                    height: "32px",
                                                                                    borderRadius: "50%",
                                                                                    background: "var(--green-a3)",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    flexShrink: 0,
                                                                                }}
                                                                            >
                                                                                <MapPin size={16} />
                                                                            </Box>
                                                                            <Flex direction="column" gap="1">
                                                                                <Text size="3" weight="medium">
                                                                                    {stop.stationName}
                                                                                </Text>
                                                                                {stop.addressDetail && (
                                                                                    <Text size="2" color="gray">
                                                                                        {stop.addressDetail}
                                                                                    </Text>
                                                                                )}
                                                                                {(stop.durationFromStart ?? 0) > 0 && (
                                                                                    <Flex align="center" gap="1">
                                                                                        <Clock size={12} />
                                                                                        <Text size="1" color="gray">
                                                                                            +
                                                                                            {formatDuration(
                                                                                                stop.durationFromStart,
                                                                                            )}{" "}
                                                                                            từ điểm xuất phát
                                                                                        </Text>
                                                                                    </Flex>
                                                                                )}
                                                                            </Flex>
                                                                        </Flex>
                                                                    </Card>
                                                                ))}
                                                            </Flex>
                                                        </Tabs.Content>

                                                        <Tabs.Content value="reviews">
                                                            <Card>
                                                                <Text size="2" color="gray">
                                                                    Tính năng đánh giá đang được phát triển
                                                                </Text>
                                                            </Card>
                                                        </Tabs.Content>

                                                        <Tabs.Content value="policy">
                                                            <Card>
                                                                {trip.cancellationPolicy ? (
                                                                    <Box>
                                                                        <Heading size="4" mb="2">
                                                                            Chính sách huỷ vé
                                                                        </Heading>
                                                                        <Text
                                                                            size="2"
                                                                            style={{ whiteSpace: "pre-line" }}
                                                                        >
                                                                            {trip.cancellationPolicy}
                                                                        </Text>
                                                                    </Box>
                                                                ) : (
                                                                    <Text size="2" color="gray">
                                                                        Không có thông tin chính sách
                                                                    </Text>
                                                                )}
                                                                {trip.notes && (
                                                                    <Box mt="3">
                                                                        <Heading size="4" mb="2">
                                                                            Lưu ý
                                                                        </Heading>
                                                                        <Text
                                                                            size="2"
                                                                            style={{ whiteSpace: "pre-line" }}
                                                                        >
                                                                            {trip.notes}
                                                                        </Text>
                                                                    </Box>
                                                                )}
                                                            </Card>
                                                        </Tabs.Content>

                                                        <Tabs.Content value="amenities">
                                                            <Flex direction="column" gap="3">
                                                                {(() => {
                                                                    const grouped = amenities.reduce(
                                                                        (acc, amenity) => {
                                                                            const category =
                                                                                amenity.category ?? "other";
                                                                            if (!acc[category]) {
                                                                                acc[category] = [];
                                                                            }
                                                                            acc[category].push(amenity);
                                                                            return acc;
                                                                        },
                                                                        {} as Record<string, typeof amenities>,
                                                                    );

                                                                    return Object.entries(grouped).map(
                                                                        ([category, items]) => (
                                                                            <Box key={category}>
                                                                                <Text
                                                                                    size="2"
                                                                                    weight="bold"
                                                                                    color="gray"
                                                                                    mb="2"
                                                                                    style={{
                                                                                        textTransform: "capitalize",
                                                                                    }}
                                                                                >
                                                                                    {category}
                                                                                </Text>
                                                                                <Flex gap="2" wrap="wrap">
                                                                                    {items.map((amenity) => (
                                                                                        <Badge
                                                                                            key={amenity.amenityId}
                                                                                            variant="soft"
                                                                                            color="blue"
                                                                                            size="2"
                                                                                        >
                                                                                            {amenity.iconName && (
                                                                                                <AmenityIcon
                                                                                                    iconName={
                                                                                                        amenity.iconName
                                                                                                    }
                                                                                                    size={14}
                                                                                                    className="inline mr-1"
                                                                                                />
                                                                                            )}
                                                                                            {amenity.name}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </Flex>
                                                                            </Box>
                                                                        ),
                                                                    );
                                                                })()}
                                                            </Flex>
                                                        </Tabs.Content>

                                                        {images.length > 0 && (
                                                            <Tabs.Content value="images">
                                                                <Grid columns="2" gap="3">
                                                                    {images.map((img, idx) => (
                                                                        <Box
                                                                            key={idx}
                                                                            style={{
                                                                                borderRadius: "var(--radius-3)",
                                                                                overflow: "hidden",
                                                                            }}
                                                                        >
                                                                            <img
                                                                                src={img}
                                                                                alt={`Bus ${idx + 1}`}
                                                                                style={{
                                                                                    width: "100%",
                                                                                    height: "200px",
                                                                                    objectFit: "cover",
                                                                                }}
                                                                            />
                                                                        </Box>
                                                                    ))}
                                                                </Grid>
                                                            </Tabs.Content>
                                                        )}
                                                    </Box>
                                                </Tabs.Root>
                                            </>
                                        );
                                    })()}
                                </Flex>
                            ) : (
                                <Text size="2" color="gray" align="center">
                                    Không tìm thấy thông tin chuyến đi
                                </Text>
                            )}
                        </Box>
                    </ScrollArea>

                    {trip && (
                        <Box
                            p="4"
                            style={{
                                borderTop: "1px solid var(--gray-a4)",
                                flexShrink: 0,
                            }}
                        >
                            <Flex justify="between" align="center">
                                <Box>
                                    <Text size="1" color="gray">
                                        Tổng giá
                                    </Text>
                                    <Text size="5" weight="bold" color="blue">
                                        {formatPrice(trip.lowestPrice)}
                                    </Text>
                                </Box>
                                <Button size="3" color="amber" style={{ minWidth: "150px" }}>
                                    Chọn chuyến
                                </Button>
                            </Flex>
                        </Box>
                    )}
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
