import {
    Box,
    Flex,
    Grid,
    Container,
    Heading,
    Text,
    Button,
    Card,
    Inset,
    TextField,
    Tabs,
    Badge,
    Avatar,
    Link,
} from "@radix-ui/themes";
import { useThemeContext } from "@/controller/ThemeProvider";
import { ArrowRight, Calendar, Headset, MapPin, Search, ShieldCheck, Sparkles, Star, Ticket } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

const PROMOS = [
    {
        id: 1,
        titleKey: "hero.promotions.items.newUser.title",
        code: "NEW20",
        image: "/images/promo-new-user.svg",
        validUntilKey: "hero.promotions.items.newUser.validUntil",
    },
    {
        id: 2,
        titleKey: "hero.promotions.items.dalat.title",
        code: "DALAT50K",
        image: "/images/promo-dalat.svg",
        validUntilKey: "hero.promotions.items.dalat.validUntil",
    },
    {
        id: 3,
        titleKey: "hero.promotions.items.roundtrip.title",
        code: "KHUHOI100",
        image: "/images/promo-roundtrip.svg",
        validUntilKey: "hero.promotions.items.roundtrip.validUntil",
    },
];

const POPULAR_ROUTES = [
    {
        id: 1,
        fromKey: "hero.popularRoutes.places.saigon",
        toKey: "hero.popularRoutes.places.dalat",
        price: "250.000đ",
        oldPrice: "350.000đ",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=900&h=700",
    },
    {
        id: 2,
        fromKey: "hero.popularRoutes.places.hanoi",
        toKey: "hero.popularRoutes.places.sapa",
        price: "300.000đ",
        oldPrice: "400.000đ",
        image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&q=80&w=900&h=700",
    },
    {
        id: 3,
        fromKey: "hero.popularRoutes.places.saigon",
        toKey: "hero.popularRoutes.places.nhatrang",
        price: "220.000đ",
        oldPrice: "",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=900&h=700",
    },
    {
        id: 4,
        fromKey: "hero.popularRoutes.places.danang",
        toKey: "hero.popularRoutes.places.hoian",
        price: "100.000đ",
        oldPrice: "150.000đ",
        image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=900&h=700",
    },
];

function HeroAndSearch() {
    const { mode } = useThemeContext();
    const { t } = useTranslation();

    return (
        <Box position="relative" pb="9" style={{ backgroundColor: "var(--gray-2)" }}>
            <div
                className={clsx("relative flex items-center justify-center h-96 bg-cover bg-center")}
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
                            {t("hero.title")}
                        </Heading>
                        <Text size="5" align="center" color="gray">
                            {t("hero.subtitle")}
                        </Text>
                    </Flex>
                </Container>
            </div>

            <Container size="4" px="4" style={{ marginTop: "-64px", position: "relative", zIndex: 10 }}>
                <Card size="3" variant="surface" className="pt-3!">
                    <Tabs.Root defaultValue="oneway">
                        <Tabs.List size="2" mb="4" color="blue">
                            <Tabs.Trigger value="oneway">
                                <Flex align="center" gap="2">
                                    {t("hero.tabs.oneway")}
                                </Flex>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="roundtrip">
                                <Flex align="center" gap="2">
                                    {t("hero.tabs.roundtrip")}
                                </Flex>
                            </Tabs.Trigger>
                        </Tabs.List>

                        <Box pt="2">
                            <Tabs.Content value="oneway">
                                <Grid columns={{ initial: "1", md: "4" }} gap="4" align="end">
                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("hero.fields.from")}
                                        </Text>
                                        <TextField.Root size="3" placeholder={t("hero.placeholders.fromFull")}>
                                            <TextField.Slot>
                                                <MapPin size={18} />
                                            </TextField.Slot>
                                        </TextField.Root>
                                    </Box>

                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("hero.fields.to")}
                                        </Text>
                                        <TextField.Root size="3" placeholder={t("hero.placeholders.toFull")}>
                                            <TextField.Slot>
                                                <MapPin size={18} />
                                            </TextField.Slot>
                                        </TextField.Root>
                                    </Box>

                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("hero.fields.departureDate")}
                                        </Text>
                                        <TextField.Root size="3" type="date">
                                            <TextField.Slot>
                                                <Calendar size={18} />
                                            </TextField.Slot>
                                        </TextField.Root>
                                    </Box>

                                    <Button size="3" color="amber" variant="solid" style={{ cursor: "pointer" }}>
                                        <Search size={18} />
                                        {t("hero.actions.searchTrip")}
                                    </Button>
                                </Grid>
                            </Tabs.Content>

                            <Tabs.Content value="roundtrip">
                                <Grid columns={{ initial: "1", md: "5" }} gap="4" align="end">
                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("hero.fields.from")}
                                        </Text>
                                        <TextField.Root size="3" placeholder={t("hero.placeholders.fromShort")}>
                                            <TextField.Slot>
                                                <MapPin size={18} />
                                            </TextField.Slot>
                                        </TextField.Root>
                                    </Box>

                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("hero.fields.to")}
                                        </Text>
                                        <TextField.Root size="3" placeholder={t("hero.placeholders.toShort")}>
                                            <TextField.Slot>
                                                <MapPin size={18} />
                                            </TextField.Slot>
                                        </TextField.Root>
                                    </Box>

                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("hero.fields.departureDate")}
                                        </Text>
                                        <TextField.Root size="3" type="date">
                                            <TextField.Slot>
                                                <Calendar size={18} />
                                            </TextField.Slot>
                                        </TextField.Root>
                                    </Box>

                                    <Box>
                                        <Text as="div" size="2" weight="bold" mb="2" color="gray" highContrast>
                                            {t("hero.fields.returnDate")}
                                        </Text>
                                        <TextField.Root size="3" type="date">
                                            <TextField.Slot>
                                                <Calendar size={18} />
                                            </TextField.Slot>
                                        </TextField.Root>
                                    </Box>

                                    <Button size="3" color="amber" variant="solid" style={{ cursor: "pointer" }}>
                                        <Search size={18} />
                                        {t("hero.actions.search")}
                                    </Button>
                                </Grid>
                            </Tabs.Content>
                        </Box>
                    </Tabs.Root>
                </Card>
            </Container>
        </Box>
    );
}

function Promotions() {
    const { t } = useTranslation();

    return (
        <Box py={{ initial: "7", md: "9" }} style={{ backgroundColor: "var(--color-background)" }}>
            <Container size="4" px="4">
                <Flex justify="between" align={{ initial: "start", sm: "end" }} mb="6" gap="4" wrap="wrap">
                    <Box>
                        <Badge size="2" color="orange" variant="soft" mb="3">
                            <Sparkles size={14} />
                            {t("hero.promotions.badge")}
                        </Badge>
                        <Heading size={{ initial: "6", md: "7" }} weight="bold" mb="2">
                            {t("hero.promotions.title")}
                        </Heading>
                        <Text size="3" color="gray">
                            {t("hero.promotions.description")}
                        </Text>
                    </Box>

                    <Button asChild size="3" variant="soft" color="blue" highContrast>
                        <Link href="#" className="no-underline!">
                            {t("hero.promotions.viewAll")}
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
                                            {t("hero.promotions.hotDeal")}
                                        </Badge>
                                        <Badge color="orange" variant="soft" radius="full">
                                            {promo.code}
                                        </Badge>
                                    </Flex>
                                    <Box position="absolute" bottom="0" left="0" p="6" pb="2">
                                        <Badge size="1">
                                            {t("hero.promotions.validityPrefix")} {t(promo.validUntilKey)}
                                        </Badge>
                                    </Box>
                                </Box>
                            </Inset>
                            <Flex direction="column" gap="2" p="5" pt="0" style={{ height: "100%" }}>
                                <Heading size="5" weight="bold">
                                    {t(promo.titleKey)}
                                </Heading>
                                <Text size="3" color="gray">
                                    {t("hero.promotions.cardDescription")}
                                </Text>
                                <Flex justify="between" align="center" gap="3" wrap="wrap">
                                    <Badge color="blue" variant="soft" size="2" radius="full">
                                        {t("hero.promotions.saveNow")}
                                    </Badge>
                                    <Button size="2" variant="ghost" color="blue">
                                        {t("hero.promotions.claimOffer")}
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
    const { t } = useTranslation();

    return (
        <Box py={{ initial: "7", md: "9" }} style={{ backgroundColor: "var(--gray-2)" }}>
            <Container size="4" px="4">
                <Flex justify="between" align={{ initial: "start", sm: "end" }} mb="6" gap="4" wrap="wrap">
                    <Box>
                        <Badge size="2" color="blue" variant="soft" mb="3">
                            <MapPin size={14} />
                            {t("hero.popularRoutes.badge")}
                        </Badge>
                        <Heading size={{ initial: "6", md: "7" }} weight="bold" mb="2">
                            {t("hero.popularRoutes.title")}
                        </Heading>
                        <Text size="3" color="gray">
                            {t("hero.popularRoutes.description")}
                        </Text>
                    </Box>

                    <Button asChild size="3" variant="soft" color="blue">
                        <Link href="#" className="no-underline!">
                            {t("hero.popularRoutes.exploreMore")}
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
                                                alt={t("hero.popularRoutes.imageAlt", { from, to })}
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
                                                    {t("hero.popularRoutes.priceFrom", { price: route.price })}
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
                                            {t("hero.popularRoutes.bookTrip")}
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
    const { t } = useTranslation();

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
                        {t("hero.features.badge")}
                    </Badge>
                    <Heading size={{ initial: "6", md: "7" }} align="center">
                        {t("hero.features.title")}
                    </Heading>
                    <Text size="3" color="gray" align="center" className="max-w-2xl">
                        {t("hero.features.description")}
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
                            <Heading size="5">{t("hero.features.items.choices.title")}</Heading>
                            <Text size="3" color="gray">
                                {t("hero.features.items.choices.description")}
                            </Text>
                            <Badge color="blue" variant="soft" radius="full">
                                {t("hero.features.items.choices.badge")}
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
                            <Heading size="5">{t("hero.features.items.quality.title")}</Heading>
                            <Text size="3" color="gray">
                                {t("hero.features.items.quality.description")}
                            </Text>
                            <Badge color="amber" variant="soft" radius="full">
                                {t("hero.features.items.quality.badge")}
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
                            <Heading size="5">{t("hero.features.items.support.title")}</Heading>
                            <Text size="3" color="gray">
                                {t("hero.features.items.support.description")}
                            </Text>
                            <Badge color="green" variant="soft" radius="full">
                                {t("hero.features.items.support.badge")}
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
