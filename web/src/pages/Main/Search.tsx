import { observer } from "mobx-react-lite";
import {
    Box,
    Flex,
    Grid,
    Container,
    Heading,
    Text,
    Button,
    Card,
    Checkbox,
    RadioGroup,
    Badge,
    Separator,
    Link,
} from "@radix-ui/themes";
import { Star, ArrowRight, ChevronDown } from "lucide-react";
const BUS_TICKETS = [
    {
        id: 1,
        operator: "Cúc Mừng",
        rating: 4.8,
        reviews: 124,
        type: "Limousine 34 giường VIP",
        departureTime: "17:30",
        departureLocation: "Bến xe Bắc Vinh",
        duration: "10h30m",
        arrivalTime: "04:00",
        arrivalLocation: "Bến xe Trung tâm Đà Nẵng",
        price: "450.000đ",
        oldPrice: "500.000đ",
        availableSeats: 5,
        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=200&h=200",
    },
    {
        id: 2,
        operator: "Dương Hồng",
        rating: 4.6,
        reviews: 89,
        type: "Giường nằm 40 chỗ",
        departureTime: "18:00",
        departureLocation: "Bến xe Con Cuông",
        duration: "12h",
        arrivalTime: "06:00",
        arrivalLocation: "Bến xe Trung tâm Đà Nẵng",
        price: "400.000đ",
        availableSeats: 12,
        image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=200&h=200",
    },
    {
        id: 3,
        operator: "Hải Hoàng Gia",
        rating: 4.9,
        reviews: 256,
        type: "Limousine 22 phòng (WC)",
        departureTime: "19:00",
        departureLocation: "Văn phòng Vinh",
        duration: "9h",
        arrivalTime: "04:00",
        arrivalLocation: "Văn phòng Đà Nẵng",
        price: "600.000đ",
        availableSeats: 2,
        image: "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&q=80&w=200&h=200",
    },
    {
        id: 4,
        operator: "Cúc Mừng",
        rating: 4.8,
        reviews: 124,
        type: "Limousine 34 giường VIP",
        departureTime: "20:00",
        departureLocation: "Bến xe Bắc Vinh",
        duration: "10h",
        arrivalTime: "06:00",
        arrivalLocation: "Ngã tư Túy Loan",
        price: "450.000đ",
        oldPrice: "500.000đ",
        availableSeats: 8,
        image: "https://images.unsplash.com/photo-1625642471723-12744e6e42fd?auto=format&fit=crop&q=80&w=200&h=200",
    },
    {
        id: 5,
        operator: "Tú Tạc",
        rating: 4.5,
        reviews: 45,
        type: "Giường nằm 44 chỗ",
        departureTime: "21:30",
        departureLocation: "Quốc lộ 1A (Vinh)",
        duration: "9h30m",
        arrivalTime: "07:00",
        arrivalLocation: "Bến xe Trung tâm Đà Nẵng",
        price: "350.000đ",
        availableSeats: 20,
        image: "https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&q=80&w=200&h=200",
    },
];

function SearchSummary() {
    return (
        <Box py="3" style={{ backgroundColor: "var(--blue-2)", borderBottom: "1px solid var(--blue-4)" }}>
            <Container size="4" px="4">
                <Flex justify="between" align="center" wrap="wrap" gap="3">
                    <Flex align="center" gap="3" wrap="wrap">
                        <Text size="4" weight="bold" color="blue" highContrast>
                            Nghệ An <ArrowRight size={16} className="inline-block mx-1" /> Đà Nẵng
                        </Text>
                        <Separator orientation="vertical" size="1" color="blue" className="hidden sm:block" />
                        <Text size="3" color="blue">
                            13/04/2026
                        </Text>
                    </Flex>
                    <Button variant="soft" color="blue" size="2">
                        Thay đổi tìm kiếm
                    </Button>
                </Flex>
            </Container>
        </Box>
    );
}

function FilterSidebar() {
    return (
        <Card size="3" variant="surface" style={{ backgroundColor: "var(--color-panel-solid)" }}>
            <Flex direction="column" gap="5">
                {/* Sắp xếp */}
                <Box>
                    <Heading size="3" mb="3">
                        Sắp xếp
                    </Heading>
                    <RadioGroup.Root defaultValue="default" name="sort">
                        <Flex direction="column" gap="2">
                            <Text as="label" size="2">
                                <Flex gap="2" align="center">
                                    <RadioGroup.Item value="default" /> Mặc định
                                </Flex>
                            </Text>
                            <Text as="label" size="2">
                                <Flex gap="2" align="center">
                                    <RadioGroup.Item value="time-asc" /> Giờ đi sớm nhất
                                </Flex>
                            </Text>
                            <Text as="label" size="2">
                                <Flex gap="2" align="center">
                                    <RadioGroup.Item value="time-desc" /> Giờ đi muộn nhất
                                </Flex>
                            </Text>
                            <Text as="label" size="2">
                                <Flex gap="2" align="center">
                                    <RadioGroup.Item value="price-asc" /> Giá tăng dần
                                </Flex>
                            </Text>
                            <Text as="label" size="2">
                                <Flex gap="2" align="center">
                                    <RadioGroup.Item value="price-desc" /> Giá giảm dần
                                </Flex>
                            </Text>
                        </Flex>
                    </RadioGroup.Root>
                </Box>

                <Separator size="4" />

                {/* Giờ đi */}
                <Box>
                    <Heading size="3" mb="3">
                        Giờ đi
                    </Heading>
                    <Flex direction="column" gap="2">
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox defaultChecked /> Sáng sớm 00:00 - 06:00 (1)
                            </Flex>
                        </Text>
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox /> Sáng 06:00 - 12:00 (0)
                            </Flex>
                        </Text>
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox defaultChecked /> Chiều 12:00 - 18:00 (2)
                            </Flex>
                        </Text>
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox defaultChecked /> Tối 18:00 - 24:00 (8)
                            </Flex>
                        </Text>
                    </Flex>
                </Box>

                <Separator size="4" />

                {/* Nhà xe */}
                <Box>
                    <Heading size="3" mb="3">
                        Nhà xe
                    </Heading>
                    <Flex direction="column" gap="2">
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox defaultChecked /> Cúc Mừng (4)
                            </Flex>
                        </Text>
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox defaultChecked /> Dương Hồng (2)
                            </Flex>
                        </Text>
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox defaultChecked /> Hải Hoàng Gia (3)
                            </Flex>
                        </Text>
                        <Text as="label" size="2">
                            <Flex gap="2" align="center">
                                <Checkbox defaultChecked /> Tú Tạc (1)
                            </Flex>
                        </Text>
                    </Flex>
                </Box>
            </Flex>
        </Card>
    );
}

function TicketCard({ ticket }: { ticket: (typeof BUS_TICKETS)[0] }) {
    return (
        <Card size="3" variant="surface" style={{ backgroundColor: "var(--color-panel-solid)", overflow: "visible" }}>
            <Grid columns={{ initial: "1", sm: "1fr 200px" }} gap="4">
                {/* Cột trái: Ảnh + Thông tin chuyến */}
                <Flex gap="4" direction={{ initial: "column", sm: "row" }}>
                    <Box style={{ flexShrink: 0, width: "140px" }}>
                        <img
                            src={ticket.image}
                            alt={ticket.operator}
                            style={{
                                width: "100%",
                                height: "140px",
                                objectFit: "cover",
                                borderRadius: "var(--radius-3)",
                            }}
                        />
                    </Box>

                    <Flex direction="column" justify="between" style={{ flexGrow: 1 }}>
                        <Box>
                            <Flex align="center" gap="2" mb="1">
                                <Heading size="4" weight="bold">
                                    {ticket.operator}
                                </Heading>
                                <Badge color="green" size="1" variant="soft">
                                    <Star size={12} className="inline mr-1" />
                                    {ticket.rating} ({ticket.reviews})
                                </Badge>
                            </Flex>
                            <Text size="2" color="gray" as="div" mb="3">
                                {ticket.type}
                            </Text>
                        </Box>

                        {/* Timeline chuyến đi */}
                        <Flex align="center" gap="3" style={{ position: "relative" }}>
                            {/* Điểm đi */}
                            <Flex direction="column" align="center">
                                <Text size="4" weight="bold">
                                    {ticket.departureTime}
                                </Text>
                                <Text size="2" color="gray">
                                    {ticket.departureLocation}
                                </Text>
                            </Flex>

                            {/* Đường nối giữa */}
                            <Box style={{ flexGrow: 1, position: "relative", textAlign: "center" }}>
                                <Text
                                    size="1"
                                    color="gray"
                                    style={{
                                        backgroundColor: "var(--color-panel-solid)",
                                        position: "relative",
                                        zIndex: 2,
                                        padding: "0 4px",
                                    }}
                                >
                                    {ticket.duration}
                                </Text>
                                <Box
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: 0,
                                        right: 0,
                                        height: "1px",
                                        backgroundColor: "var(--gray-a6)",
                                        zIndex: 1,
                                    }}
                                ></Box>
                                {/* 2 dấu chấm */}
                                <Box
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: 0,
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "var(--gray-a8)",
                                        transform: "translateY(-50%)",
                                        zIndex: 2,
                                    }}
                                ></Box>
                                <Box
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        right: 0,
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "var(--gray-a8)",
                                        transform: "translateY(-50%)",
                                        zIndex: 2,
                                    }}
                                ></Box>
                            </Box>

                            {/* Điểm đến */}
                            <Flex direction="column" align="center">
                                <Text size="4" weight="bold">
                                    {ticket.arrivalTime}
                                </Text>
                                <Text size="2" color="gray">
                                    {ticket.arrivalLocation}
                                </Text>
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>

                <Flex
                    direction={{ initial: "row", sm: "column" }}
                    justify={{ initial: "between", sm: "between" }}
                    align={{ initial: "end", sm: "end" }}
                    style={{ borderLeft: "1px dashed var(--gray-a4)", paddingLeft: "16px" }}
                >
                    <Box className="text-right">
                        <Text size="5" weight="bold" color="blue" as="div">
                            {ticket.price}
                        </Text>
                        {ticket.oldPrice && (
                            <Text size="2" color="gray" style={{ textDecoration: "line-through" }} as="div">
                                {ticket.oldPrice}
                            </Text>
                        )}
                    </Box>

                    <Flex direction="column" align="end" gap="2">
                        <Text size="2" color={ticket.availableSeats < 5 ? "orange" : "green"}>
                            Còn {ticket.availableSeats} chỗ trống
                        </Text>
                        <Button size="3" color="amber" variant="solid" style={{ cursor: "pointer", width: "100%" }}>
                            Chọn chuyến
                        </Button>
                        <Link href="#" size="2" color="blue">
                            Thông tin chi tiết <ChevronDown size={14} className="inline align-middle" />
                        </Link>
                    </Flex>
                </Flex>
            </Grid>
        </Card>
    );
}

const PageMainSearch = observer(() => {
    return (
        <>
            <Box
                style={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                    backgroundColor: "var(--gray-2)",
                }}
            >
                <SearchSummary />

                <Box style={{ flexGrow: 1 }} py="6">
                    <Container size="4" px="4">
                        <Grid columns={{ initial: "1", md: "4" }} gap="6">
                            <Box style={{ gridColumn: "span 1" }} className="hidden md:block">
                                <FilterSidebar />
                            </Box>
                            <Box style={{ gridColumn: "span 3" }}>
                                <Heading size="5" mb="4" highContrast>
                                    Đặt mua vé xe đi Đà Nẵng từ Nghệ An chất lượng cao và giá vé ưu đãi nhất
                                </Heading>
                                <Card
                                    size="1"
                                    mb="4"
                                    style={{
                                        backgroundColor: "var(--blue-3)",
                                        border: "1px solid var(--blue-5)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Flex justify="center" p="2">
                                        <Text size="3" color="blue" weight="bold">
                                            🎉 Nhập mã <Badge color="amber">VNPAY50K</Badge> giảm ngay 50K khi thanh
                                            toán qua VNPAY
                                        </Text>
                                    </Flex>
                                </Card>

                                <Flex direction="column" gap="4">
                                    {BUS_TICKETS.map((ticket) => (
                                        <TicketCard key={ticket.id} ticket={ticket} />
                                    ))}
                                </Flex>
                            </Box>
                        </Grid>
                    </Container>
                </Box>
            </Box>
        </>
    );
});

export default PageMainSearch;
