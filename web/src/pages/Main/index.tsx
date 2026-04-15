import { Box, Flex, Grid, Container, Heading, Text, Button, Card, Inset, Badge, Avatar, Link } from "@radix-ui/themes";
import { useThemeContext } from "@/controller/ThemeProvider";
import { ArrowRight, Headset, MapPin, PlusIcon, Search, ShieldCheck, Sparkles, Star, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DatePickerInput } from "@/components/ui/datepicker";
import { useState } from "react";
import AddressSearch from "@/components/Main/AddressSearch";

const PROMOS = [
    {
        id: 1,
        titleKey: "promotions.items.newUser.title",
        code: "NEW20",
        image: "/images/promo-new-user.svg",
        validUntilKey: "promotions.items.newUser.validUntil",
    },
    {
        id: 2,
        titleKey: "promotions.items.dalat.title",
        code: "DALAT50K",
        image: "/images/promo-dalat.svg",
        validUntilKey: "promotions.items.dalat.validUntil",
    },
    {
        id: 3,
        titleKey: "promotions.items.roundtrip.title",
        code: "KHUHOI100",
        image: "/images/promo-roundtrip.svg",
        validUntilKey: "promotions.items.roundtrip.validUntil",
    },
];

const POPULAR_ROUTES = [
    {
        id: 1,
        fromKey: "popularRoutes.places.saigon",
        toKey: "popularRoutes.places.dalat",
        price: "250.000đ",
        oldPrice: "350.000đ",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=900&h=700",
    },
    {
        id: 2,
        fromKey: "popularRoutes.places.hanoi",
        toKey: "popularRoutes.places.sapa",
        price: "300.000đ",
        oldPrice: "400.000đ",
        image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&q=80&w=900&h=700",
    },
    {
        id: 3,
        fromKey: "popularRoutes.places.saigon",
        toKey: "popularRoutes.places.nhatrang",
        price: "220.000đ",
        oldPrice: "",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=900&h=700",
    },
    {
        id: 4,
        fromKey: "popularRoutes.places.danang",
        toKey: "popularRoutes.places.hoian",
        price: "100.000đ",
        oldPrice: "150.000đ",
        image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=900&h=700",
    },
];

function HeroAndSearch() {
    const { mode } = useThemeContext();
    const { t } = useTranslation("hero");
    const [withReturnDate, setWithReturnDate] = useState(false);

    return (
        <Box position="relative" pb="9" style={{ backgroundColor: "var(--gray-2)" }}>
            <div
                className={cn("relative flex items-center justify-center h-96 bg-cover bg-center")}
                style={{
                    backgroundImage:
                        mode === 1
                            ? "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000')"
                            : "linear-gradient(rgba(255,255,255, 0.9), rgba(255,255,255, 0.9)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000')",
                }}
            >
                <Container size="4" px="4" className="h-fit mb-16 flex-1">
                    <Flex direction="column" justify="center" align="center" className="h-full flex-1" gap="2" pt="6">
                        <Heading size={{ initial: "7", md: "8" }} align="center">
                            {t("title")}
                        </Heading>
                        <Text size="5" align="center" color="gray">
                            {t("subtitle")}
                        </Text>
                    </Flex>
                </Container>
            </div>

            <Container size="4" px="4" style={{ marginTop: "-64px", position: "relative", zIndex: 10 }}>
                <Card size="3" variant="surface" className="pt-3!">
                    <Box pt="2">
                        <Grid columns={{ initial: "1", md: "1" }} gap="6" align="start">
                            <Grid columns={{ initial: "1", md: "3" }} gap="4" align="end">
                                <Box>
                                    <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                        {t("fields.from")}
                                    </Text>
                                    <AddressSearch
                                        inputProps={{
                                            placeholder: t("placeholders.fromFull"),
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                        {t("fields.to")}
                                    </Text>
                                    <AddressSearch
                                        inputProps={{
                                            placeholder: t("placeholders.toFull"),
                                        }}
                                    />
                                </Box>
                                <Grid columns={{ initial: "2", md: "2" }} gap="4" align="end">
                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("fields.departureDate")}
                                        </Text>
                                        <DatePickerInput
                                            inputProps={{
                                                placeholder: t("fields.departureDate"),
                                            }}
                                        />
                                    </Box>
                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("fields.returnDate")}
                                        </Text>
                                        {withReturnDate ? (
                                            <DatePickerInput
                                                inputProps={{
                                                    placeholder: t("fields.returnDate"),
                                                }}
                                            />
                                        ) : (
                                            <Button
                                                variant="soft"
                                                color="gray"
                                                size="3"
                                                onClick={() => setWithReturnDate(true)}
                                            >
                                                <PlusIcon size={14} />
                                                {t("actions.addReturnDate")}
                                            </Button>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                            <Button size="3" color="amber" variant="solid" style={{ cursor: "pointer" }}>
                                <Search size={18} />
                                {t("actions.search")}
                            </Button>
                        </Grid>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
}

function Promotions() {
    const { t } = useTranslation("hero");

    return (
        <Box py={{ initial: "7", md: "9" }} style={{ backgroundColor: "var(--color-background)" }}>
            <Container size="4" px="4">
                <Flex justify="between" align={{ initial: "start", sm: "end" }} mb="6" gap="4" wrap="wrap">
                    <Box>
                        <Badge size="2" color="orange" variant="soft" mb="3">
                            <Sparkles size={14} />
                            {t("promotions.badge")}
                        </Badge>
                        <Heading size={{ initial: "6", md: "7" }} weight="bold" mb="2">
                            {t("promotions.title")}
                        </Heading>
                        <Text size="3" color="gray">
                            {t("promotions.description")}
                        </Text>
                    </Box>

                    <Button asChild size="3" variant="soft" color="blue" highContrast>
                        <Link href="#" className="no-underline!">
                            {t("promotions.viewAll")}
                            <ArrowRight size={16} />
                        </Link>
                    </Button>
                </Flex>

                <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="5">
                    {PROMOS.map((promo) => (
                        <Card
                            key={promo.id}
                            size="3"
                            variant="surface"
                            className="group overflow-hidden"
                            style={{ padding: 0, cursor: "pointer" }}
                        >
                            <Inset clip="padding-box" side="top" pb="current">
                                <Box position="relative" className="overflow-hidden">
                                    <img
                                        src={promo.image}
                                        alt={t(promo.titleKey)}
                                        className="block h-44 w-full object-cover"
                                    />
                                    <Box
                                        position="absolute"
                                        inset="0"
                                        className="bg-linear-to-t from-black/70 via-black/10 to-transparent"
                                    />
                                    <Flex position="absolute" top="0" left="0" p="4" gap="2" wrap="wrap">
                                        <Badge color="crimson" variant="solid" radius="full">
                                            {t("promotions.hotDeal")}
                                        </Badge>
                                        <Badge color="orange" variant="soft" radius="full">
                                            {promo.code}
                                        </Badge>
                                    </Flex>
                                    <Box position="absolute" bottom="0" left="0" p="6" pb="2">
                                        <Badge size="1">
                                            {t("promotions.validityPrefix")} {t(promo.validUntilKey)}
                                        </Badge>
                                    </Box>
                                </Box>
                            </Inset>
                            <Flex direction="column" gap="2" p="5" pt="0" style={{ height: "100%" }}>
                                <Heading size="5" weight="bold">
                                    {t(promo.titleKey)}
                                </Heading>
                                <Text size="3" color="gray">
                                    {t("promotions.cardDescription")}
                                </Text>
                                <Flex justify="between" align="center" gap="3" wrap="wrap">
                                    <Badge color="blue" variant="soft" size="2" radius="full">
                                        {t("promotions.saveNow")}
                                    </Badge>
                                    <Button size="2" variant="ghost" color="blue">
                                        {t("promotions.claimOffer")}
                                        <ArrowRight size={15} />
                                    </Button>
                                </Flex>
                            </Flex>
                        </Card>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

function PopularRoutes() {
    const { t } = useTranslation("hero");

    return (
        <Box py={{ initial: "7", md: "9" }} style={{ backgroundColor: "var(--gray-2)" }}>
            <Container size="4" px="4">
                <Flex justify="between" align={{ initial: "start", sm: "end" }} mb="6" gap="4" wrap="wrap">
                    <Box>
                        <Badge size="2" color="blue" variant="soft" mb="3">
                            <MapPin size={14} />
                            {t("popularRoutes.badge")}
                        </Badge>
                        <Heading size={{ initial: "6", md: "7" }} weight="bold" mb="2">
                            {t("popularRoutes.title")}
                        </Heading>
                        <Text size="3" color="gray">
                            {t("popularRoutes.description")}
                        </Text>
                    </Box>

                    <Button asChild size="3" variant="soft" color="blue">
                        <Link href="#" className="no-underline!">
                            {t("popularRoutes.exploreMore")}
                            <ArrowRight size={16} />
                        </Link>
                    </Button>
                </Flex>

                <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="4">
                    {POPULAR_ROUTES.map((route) =>
                        (() => {
                            const from = t(route.fromKey);
                            const to = t(route.toKey);

                            return (
                                <Card
                                    key={route.id}
                                    size="2"
                                    variant="surface"
                                    className="group overflow-hidden"
                                    style={{ cursor: "pointer", padding: 0 }}
                                >
                                    <Inset clip="padding-box" side="top" pb="current">
                                        <Box position="relative" className="overflow-hidden">
                                            <img
                                                src={route.image}
                                                alt={t("popularRoutes.imageAlt", { from, to })}
                                                className="block h-44 w-full object-cover"
                                            />
                                            <Box
                                                position="absolute"
                                                bottom="0"
                                                left="0"
                                                width="100%"
                                                p="6"
                                                pb="2"
                                                style={{
                                                    background:
                                                        "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.08), transparent)",
                                                }}
                                            >
                                                <Badge color="blue" variant="solid" radius="full" mb="2" size="1">
                                                    {t("popularRoutes.priceFrom", { price: route.price })}
                                                </Badge>
                                                <Heading size="5" weight="bold" style={{ color: "white" }}>
                                                    {from} - {to}
                                                </Heading>
                                            </Box>
                                        </Box>
                                    </Inset>
                                    <Flex direction="column" gap="4" p="4" pt="0">
                                        <Flex align="center" gap="1" wrap="wrap">
                                            <Text size="5" weight="bold" color="blue">
                                                {route.price}
                                            </Text>
                                            {route.oldPrice && (
                                                <Text size="2" color="gray" style={{ textDecoration: "line-through" }}>
                                                    {route.oldPrice}
                                                </Text>
                                            )}
                                        </Flex>

                                        <Button size="2" variant="soft" color="blue" className="justify-between!">
                                            {t("popularRoutes.bookTrip")}
                                            <ArrowRight size={16} />
                                        </Button>
                                    </Flex>
                                </Card>
                            );
                        })(),
                    )}
                </Grid>
            </Container>
        </Box>
    );
}

function Features() {
    const { t } = useTranslation("hero");

    return (
        <Box
            py={{ initial: "8", md: "9" }}
            style={{
                backgroundColor: "var(--color-background)",
                borderTop: "1px solid var(--gray-a4)",
            }}
        >
            <Container size="4" px="4">
                <Flex direction="column" align="center" gap="3" mb="7">
                    <Badge size="2" color="jade" variant="soft">
                        <ShieldCheck size={14} />
                        {t("features.badge")}
                    </Badge>
                    <Heading size={{ initial: "6", md: "7" }} align="center">
                        {t("features.title")}
                    </Heading>
                    <Text size="3" color="gray" align="center" className="max-w-2xl">
                        {t("features.description")}
                    </Text>
                </Flex>

                <Grid columns={{ initial: "1", md: "3" }} gap="5">
                    <Card size="3" variant="surface" className="rounded-3xl border border-(--gray-a4) p-6!">
                        <Flex direction="column" gap="4" align="start">
                            <Avatar
                                size="6"
                                fallback={<Ticket size={32} />}
                                color="blue"
                                variant="soft"
                                radius="large"
                            />
                            <Heading size="5">{t("features.items.choices.title")}</Heading>
                            <Text size="3" color="gray">
                                {t("features.items.choices.description")}
                            </Text>
                            <Badge color="blue" variant="soft" radius="full">
                                {t("features.items.choices.badge")}
                            </Badge>
                        </Flex>
                    </Card>

                    <Card size="3" variant="surface" className="rounded-3xl border border-(--gray-a4) p-6!">
                        <Flex direction="column" gap="4" align="start">
                            <Avatar
                                size="6"
                                fallback={<Star size={32} />}
                                color="amber"
                                variant="soft"
                                radius="large"
                            />
                            <Heading size="5">{t("features.items.quality.title")}</Heading>
                            <Text size="3" color="gray">
                                {t("features.items.quality.description")}
                            </Text>
                            <Badge color="amber" variant="soft" radius="full">
                                {t("features.items.quality.badge")}
                            </Badge>
                        </Flex>
                    </Card>

                    <Card size="3" variant="surface" className="rounded-3xl border border-(--gray-a4) p-6!">
                        <Flex direction="column" gap="4" align="start">
                            <Avatar
                                size="6"
                                fallback={<Headset size={32} />}
                                color="green"
                                variant="soft"
                                radius="large"
                            />
                            <Heading size="5">{t("features.items.support.title")}</Heading>
                            <Text size="3" color="gray">
                                {t("features.items.support.description")}
                            </Text>
                            <Badge color="green" variant="soft" radius="full">
                                {t("features.items.support.badge")}
                            </Badge>
                        </Flex>
                    </Card>
                </Grid>
            </Container>
        </Box>
    );
}

export default function PageMainIndex() {
    return (
        <>
            <HeroAndSearch />
            <Promotions />
            <PopularRoutes />
            <Features />
        </>
    );
}
