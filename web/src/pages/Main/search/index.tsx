import { getApiTripsSearch } from "@/api";
import type { ProblemDetails, TimeRangeFilter, TripSearchItemDto, TripSearchResult, TripSortBy } from "@/api";
import AmenityIcon from "@/pages/Main/search/components/AmenityIcon";
import TripDetailDialog from "@/pages/Main/search/components/TripDetailDialog";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import {
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Container,
    Flex,
    Grid,
    Heading,
    RadioGroup,
    Separator,
    Skeleton,
    Text,
    TextField,
} from "@radix-ui/themes";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowRight, ChevronDown, Search, SlidersHorizontal, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type SearchFiltersState = {
    sortBy: TripSortBy;
    companyIds: string[];
    timeRanges: TimeRangeFilter[];
    amenities: string[];
    minPrice: string;
    maxPrice: string;
};

type ParsedSearchQuery = {
    fromProvinceCode: string;
    fromDistrictCode?: string;
    fromWardCode?: string;
    toProvinceCode: string;
    toDistrictCode?: string;
    toWardCode?: string;
    departureDate: string;
};

const DEFAULT_FILTERS: SearchFiltersState = {
    sortBy: 0,
    companyIds: [],
    timeRanges: [],
    amenities: [],
    minPrice: "",
    maxPrice: "",
};

function parseSearchQuery(searchParams: URLSearchParams): ParsedSearchQuery | null {
    const fromProvinceCode = searchParams.get("fp")?.trim() ?? "";
    const toProvinceCode = searchParams.get("tp")?.trim() ?? "";
    const departureDate = searchParams.get("date")?.trim() ?? "";

    if (!fromProvinceCode || !toProvinceCode || !departureDate) {
        return null;
    }

    const parsedDepartureDate = new Date(departureDate);

    return {
        fromProvinceCode,
        fromDistrictCode: searchParams.get("fd")?.trim() || undefined,
        fromWardCode: searchParams.get("fw")?.trim() || undefined,
        toProvinceCode,
        toDistrictCode: searchParams.get("td")?.trim() || undefined,
        toWardCode: searchParams.get("tw")?.trim() || undefined,
        departureDate:
            /^\d{4}-\d{2}-\d{2}$/.test(departureDate) || Number.isNaN(parsedDepartureDate.getTime())
                ? departureDate
                : format(parsedDepartureDate, "yyyy-MM-dd"),
    };
}

function parseApiErrorMessage(error: unknown, fallback: string) {
    if (!error) {
        return fallback;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === "object") {
        const problem = error as ProblemDetails & { message?: string; error?: string };
        if (typeof problem.message === "string") {
            return problem.message;
        }
        if (typeof problem.error === "string") {
            return problem.error;
        }
        if (typeof problem.title === "string") {
            return problem.title;
        }
        if (typeof problem.detail === "string") {
            return problem.detail;
        }
    }

    return fallback;
}

function formatCurrency(value?: number) {
    if (value === undefined) {
        return "--";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDateLabel(value?: string) {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return format(date, "dd/MM/yyyy", { locale: vi });
}

function formatTimeLabel(value?: string) {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return format(date, "HH:mm", { locale: vi });
}

function formatDurationLabel(durationMinutes?: number) {
    if (durationMinutes === undefined) {
        return "--";
    }

    if (durationMinutes <= 0) {
        return "--";
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h${minutes}m`;
}

function SearchSummary({ result, onChangeSearch }: { result: TripSearchResult; onChangeSearch: () => void }) {
    const { t } = useTranslation();

    return (
        <Box py="3" style={{ backgroundColor: "var(--blue-2)", borderBottom: "1px solid var(--blue-4)" }}>
            <Container size="4" px="4">
                <Flex justify="between" align="center" wrap="wrap" gap="3">
                    <Flex align="center" gap="3" wrap="wrap">
                        <Heading size="4" weight="bold" color="blue" highContrast>
                            {result.summary?.origin?.displayName || "--"}{" "}
                            <ArrowRight size={16} className="inline-block mx-1" />{" "}
                            {result.summary?.destination?.displayName || "--"}
                        </Heading>
                        <Separator orientation="vertical" size="1" color="blue" className="hidden sm:block" />
                        <Text size="3" color="blue">
                            {result.summary?.departureDate ? formatDateLabel(result.summary.departureDate) : "--"}
                        </Text>
                        <Separator orientation="vertical" size="1" color="blue" className="hidden sm:block" />
                        <Text size="3" color="blue">
                            {t("search:summary_trips_count", { count: result.totalResults })}
                        </Text>
                    </Flex>
                    <Button variant="soft" color="blue" size="2" onClick={onChangeSearch}>
                        {t("search:summary_change_search")}
                    </Button>
                </Flex>
            </Container>
        </Box>
    );
}

function FilterSidebar({
    result,
    filters,
    onSortChange,
    onToggleCompany,
    onToggleTimeRange,
    onToggleAmenity,
    onPriceChange,
    onReset,
}: {
    result: TripSearchResult;
    filters: SearchFiltersState;
    onSortChange: (value: TripSortBy) => void;
    onToggleCompany: (companyId: string) => void;
    onToggleTimeRange: (value: TimeRangeFilter) => void;
    onToggleAmenity: (value: string) => void;
    onPriceChange: (field: "minPrice" | "maxPrice", value: string) => void;
    onReset: () => void;
}) {
    const { t } = useTranslation();

    const SORT_OPTIONS: Array<{ value: TripSortBy; label: string }> = [
        { value: 0, label: t("search:filter_sort_default") },
        { value: 1, label: t("search:filter_sort_earliest") },
        { value: 2, label: t("search:filter_sort_latest") },
        { value: 4, label: t("search:filter_sort_price_asc") },
        { value: 5, label: t("search:filter_sort_price_desc") },
        { value: 3, label: t("search:filter_sort_rating") },
    ];

    const TIME_RANGE_LABELS: Record<number, string> = {
        1: t("search:filter_time_early_morning"),
        2: t("search:filter_time_morning"),
        3: t("search:filter_time_afternoon"),
        4: t("search:filter_time_evening"),
    };

    return (
        <Card size="3" variant="surface" style={{ backgroundColor: "var(--color-panel-solid)" }}>
            <Flex direction="column" gap="5">
                <Flex justify="between" align="center">
                    <Heading size="4">{t("search:filter_title")}</Heading>
                    <Button variant="ghost" size="1" color="gray" onClick={onReset}>
                        {t("search:filter_reset")}
                    </Button>
                </Flex>

                <Box>
                    <Heading size="3" mb="3">
                        {t("search:filter_sort_title")}
                    </Heading>
                    <RadioGroup.Root
                        value={String(filters.sortBy)}
                        onValueChange={(value) => onSortChange(Number(value) as TripSortBy)}
                    >
                        <Flex direction="column" gap="2">
                            {SORT_OPTIONS.map((option) => (
                                <Text as="label" size="2" key={option.value}>
                                    <Flex gap="2" align="center">
                                        <RadioGroup.Item value={String(option.value)} /> {option.label}
                                    </Flex>
                                </Text>
                            ))}
                        </Flex>
                    </RadioGroup.Root>
                </Box>

                <Separator size="4" />

                <Box>
                    <Heading size="3" mb="3">
                        {t("search:filter_price_title")}
                    </Heading>
                    <Flex direction="column" gap="2">
                        <TextField.Root
                            value={filters.minPrice}
                            onChange={(event) => onPriceChange("minPrice", event.target.value)}
                            placeholder={
                                result.filters?.priceRange?.min !== undefined
                                    ? t("search:filter_price_from", {
                                          price: formatCurrency(result.filters.priceRange.min),
                                      })
                                    : t("search:filter_price_min_placeholder")
                            }
                        />
                        <TextField.Root
                            value={filters.maxPrice}
                            onChange={(event) => onPriceChange("maxPrice", event.target.value)}
                            placeholder={
                                result.filters?.priceRange?.max !== undefined
                                    ? t("search:filter_price_to", {
                                          price: formatCurrency(result.filters.priceRange.max),
                                      })
                                    : t("search:filter_price_max_placeholder")
                            }
                        />
                    </Flex>
                </Box>

                <Separator size="4" />

                <Box>
                    <Heading size="3" mb="3">
                        {t("search:filter_time_title")}
                    </Heading>
                    <Flex direction="column" gap="2">
                        {result.filters?.departureTimeRanges?.map((option) => {
                            if (option.value === undefined) {
                                return null;
                            }

                            const timeRangeValue = option.value;

                            return (
                                <Text as="label" size="2" key={timeRangeValue}>
                                    <Flex gap="2" align="center">
                                        <Checkbox
                                            checked={filters.timeRanges.includes(timeRangeValue)}
                                            onCheckedChange={() => onToggleTimeRange(timeRangeValue)}
                                        />
                                        {TIME_RANGE_LABELS[timeRangeValue] || timeRangeValue} ({option.count ?? 0})
                                    </Flex>
                                </Text>
                            );
                        })}
                    </Flex>
                </Box>

                <Separator size="4" />

                <Box>
                    <Heading size="3" mb="3">
                        {t("search:filter_company_title")}
                    </Heading>
                    <Flex direction="column" gap="2">
                        {result.filters?.busCompanies?.map((option) => (
                            <Text as="label" size="2" key={option.companyId}>
                                <Flex gap="2" align="center">
                                    <Checkbox
                                        checked={filters.companyIds.includes(option.companyId ?? "")}
                                        onCheckedChange={() => onToggleCompany(option.companyId ?? "")}
                                    />
                                    {option.name} ({option.count ?? 0})
                                </Flex>
                            </Text>
                        ))}
                    </Flex>
                </Box>

                <Separator size="4" />

                <Box>
                    <Heading size="3" mb="3">
                        {t("search:filter_amenity_title")}
                    </Heading>
                    <Flex direction="column" gap="2">
                        {result.filters?.amenities?.length ? (
                            result.filters.amenities.map((option) => {
                                const amenity = option.amenity;
                                if (!amenity?.amenityId) return null;

                                const amenityId = amenity.amenityId;

                                return (
                                    <Text as="label" size="2" key={amenityId}>
                                        <Flex gap="2" align="center">
                                            <Checkbox
                                                checked={filters.amenities.includes(amenityId)}
                                                onCheckedChange={() => onToggleAmenity(amenityId)}
                                            />
                                            {amenity.iconName && <AmenityIcon iconName={amenity.iconName} size={14} />}
                                            {amenity.name} ({option.count ?? 0})
                                        </Flex>
                                    </Text>
                                );
                            })
                        ) : (
                            <Text size="2" color="gray">
                                {t("search:filter_amenity_no_data")}
                            </Text>
                        )}
                    </Flex>
                </Box>
            </Flex>
        </Card>
    );
}

function TicketCard({
    ticket,
    onShowDetail,
    onSelectTrip,
}: {
    ticket: TripSearchItemDto;
    onShowDetail: (tripId: string) => void;
    onSelectTrip: (tripId: string) => void;
}) {
    const { t } = useTranslation();
    const busCompanyName = ticket.busCompanyName ?? "--";
    const rating = ticket.rating ?? 0;
    const reviewCount = ticket.reviewCount ?? 0;
    const availableSeats = ticket.availableSeats ?? 0;

    return (
        <Card size="3" variant="surface" style={{ backgroundColor: "var(--color-panel-solid)", overflow: "visible" }}>
            <Grid columns={{ initial: "1", sm: "1fr 220px" }} gap="4">
                <Flex gap="4" direction={{ initial: "column", sm: "row" }}>
                    <Box style={{ flexShrink: 0, width: "140px" }}>
                        {ticket.imageUrl ? (
                            <img
                                src={ticket.imageUrl}
                                alt={busCompanyName}
                                style={{
                                    width: "100%",
                                    height: "140px",
                                    objectFit: "cover",
                                    borderRadius: "var(--radius-3)",
                                }}
                            />
                        ) : (
                            <Box
                                style={{
                                    width: "100%",
                                    height: "140px",
                                    borderRadius: "var(--radius-3)",
                                    backgroundColor: "var(--gray-4)",
                                }}
                            />
                        )}
                    </Box>

                    <Flex direction="column" justify="between" style={{ flexGrow: 1 }}>
                        <Box>
                            <Flex align="center" gap="2" mb="1" wrap="wrap">
                                <Heading size="4" weight="bold">
                                    {busCompanyName}
                                </Heading>
                                <Badge color="green" size="1" variant="soft">
                                    <Star size={12} className="inline mr-1" />
                                    {rating.toFixed(1)} ({reviewCount})
                                </Badge>
                            </Flex>
                            <Text size="2" color="gray" as="div" mb="1">
                                {ticket.busTypeName}
                            </Text>
                            <Text size="2" color="gray" as="div" mb="3">
                                {ticket.routeName}
                            </Text>
                            {ticket.amenities?.length ? (
                                <Flex gap="2" wrap="wrap" mb="3">
                                    {ticket.amenities.slice(0, 5).map((amenity, index) => {
                                        const isObj = typeof amenity !== "string";
                                        const displayName = isObj ? (amenity as any).displayName : amenity;
                                        const iconName = isObj ? (amenity as any).iconName : "";

                                        return (
                                            <Badge key={`${displayName}-${index}`} variant="soft" color="gray">
                                                {iconName && (
                                                    <AmenityIcon
                                                        iconName={iconName}
                                                        size={12}
                                                        className="inline mr-1"
                                                    />
                                                )}
                                                {displayName}
                                            </Badge>
                                        );
                                    })}
                                    {ticket.amenities.length > 5 && (
                                        <Badge variant="soft" color="gray">
                                            +{ticket.amenities.length - 5}
                                        </Badge>
                                    )}
                                </Flex>
                            ) : null}
                        </Box>

                        <Flex align="center" gap="3" style={{ position: "relative" }}>
                            <Flex direction="column" align="center">
                                <Text size="4" weight="bold">
                                    {formatTimeLabel(ticket.departureTime)}
                                </Text>
                                <Text size="2" color="gray" align="center">
                                    {ticket.departureLocation}
                                </Text>
                            </Flex>

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
                                    {formatDurationLabel(ticket.durationMinutes)}
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
                                />
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
                                />
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
                                />
                            </Box>

                            <Flex direction="column" align="center">
                                <Text size="4" weight="bold">
                                    {formatTimeLabel(ticket.arrivalTime)}
                                </Text>
                                <Text size="2" color="gray" align="center">
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
                            {formatCurrency(ticket.basePrice)}
                        </Text>
                    </Box>

                    <Flex direction="column" align="end" gap="2">
                        <Text size="2" color={availableSeats < 5 ? "orange" : "green"}>
                            {t("search:ticket_available_seats", { count: availableSeats })}
                        </Text>
                        <Button
                            size="3"
                            color="amber"
                            variant="solid"
                            style={{ cursor: "pointer", width: "100%" }}
                            onClick={() => onSelectTrip(ticket.tripId ?? "")}
                        >
                            {t("search:ticket_select_trip")}
                        </Button>
                        <Button
                            variant="ghost"
                            size="2"
                            style={{ cursor: "pointer", width: "100%" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowDetail(ticket.tripId ?? "");
                            }}
                        >
                            {t("search:ticket_detail")} <ChevronDown size={14} className="inline align-middle" />
                        </Button>
                    </Flex>
                </Flex>
            </Grid>
        </Card>
    );
}

function SearchPageSkeleton() {
    return (
        <Flex direction="column" gap="4">
            {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} size="3">
                    <Flex direction="column" gap="3">
                        <Skeleton height="24px" width="40%" />
                        <Skeleton height="18px" width="70%" />
                        <Skeleton height="120px" width="100%" />
                    </Flex>
                </Card>
            ))}
        </Flex>
    );
}

const PageMainSearch = observer(() => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const parsedQuery = useMemo(() => parseSearchQuery(searchParams), [searchParams]);
    const [filters, setFilters] = useState<SearchFiltersState>(DEFAULT_FILTERS);
    const [debouncedFilters, setDebouncedFilters] = useState<SearchFiltersState>(DEFAULT_FILTERS);
    const [result, setResult] = useState<TripSearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedFilters(filters);
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters]);

    useEffect(() => {
        setFilters(DEFAULT_FILTERS);
        setDebouncedFilters(DEFAULT_FILTERS);
    }, [parsedQuery?.departureDate, parsedQuery?.fromProvinceCode, parsedQuery?.toProvinceCode]);

    useEffect(() => {
        if (!parsedQuery) {
            setResult(null);
            setError(t("search:page_missing_query"));
            return;
        }

        let active = true;

        const fetchTrips = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await getApiTripsSearch({
                    query: {
                        FromProvinceCode: parsedQuery.fromProvinceCode,
                        FromDistrictCode: parsedQuery.fromDistrictCode,
                        FromWardCode: parsedQuery.fromWardCode,
                        ToProvinceCode: parsedQuery.toProvinceCode,
                        ToDistrictCode: parsedQuery.toDistrictCode,
                        ToWardCode: parsedQuery.toWardCode,
                        DepartureDate: parsedQuery.departureDate,
                        SortBy: debouncedFilters.sortBy,
                        BusCompanyIds: debouncedFilters.companyIds,
                        DepartureTimeRanges: debouncedFilters.timeRanges,
                        AmenityIds: debouncedFilters.amenities,
                        MinPrice: debouncedFilters.minPrice ? Number(debouncedFilters.minPrice) : undefined,
                        MaxPrice: debouncedFilters.maxPrice ? Number(debouncedFilters.maxPrice) : undefined,
                        Page: 1,
                        PageSize: 20,
                    },
                });

                if (!active) {
                    return;
                }

                if (response.error || !response.data) {
                    throw response.error ?? new Error(t("search:page_fetch_error"));
                }

                setResult(response.data as TripSearchResult);
            } catch (fetchError) {
                if (!active) {
                    return;
                }

                const message = parseApiErrorMessage(fetchError, t("search:page_fetch_error"));
                setError(message);
                setResult(null);
                toast.error(message);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void fetchTrips();

        return () => {
            active = false;
        };
    }, [parsedQuery, debouncedFilters, t]);

    const toggleCompany = (companyId: string) => {
        setFilters((current) => ({
            ...current,
            companyIds: current.companyIds.includes(companyId)
                ? current.companyIds.filter((item) => item !== companyId)
                : [...current.companyIds, companyId],
        }));
    };

    const toggleAmenity = (value: string) => {
        setFilters((current) => ({
            ...current,
            amenities: current.amenities.includes(value)
                ? current.amenities.filter((item) => item !== value)
                : [...current.amenities, value],
        }));
    };

    const toggleTimeRange = (value: TimeRangeFilter) => {
        setFilters((current) => ({
            ...current,
            timeRanges: current.timeRanges.includes(value)
                ? current.timeRanges.filter((item) => item !== value)
                : [...current.timeRanges, value],
        }));
    };

    return (
        <Box style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--gray-2)" }}>
            {result ? (
                <SearchSummary result={result} onChangeSearch={() => navigate("/")} />
            ) : (
                <Box py="3" style={{ backgroundColor: "var(--blue-2)", borderBottom: "1px solid var(--blue-4)" }}>
                    <Container size="4" px="4">
                        <Flex justify="between" align="center" wrap="wrap" gap="3">
                            <Flex align="center" gap="2">
                                <SlidersHorizontal size={16} />
                                <Text size="3" weight="bold">
                                    {t("search:page_title_searching")}
                                </Text>
                            </Flex>
                            <Button variant="soft" color="blue" size="2" onClick={() => navigate("/")}>
                                {t("search:summary_change_search")}
                            </Button>
                        </Flex>
                    </Container>
                </Box>
            )}

            <Box style={{ flexGrow: 1 }} py="6">
                <Container size="4" px="4">
                    <Grid columns={{ initial: "1", md: "4" }} gap="6">
                        <Box style={{ gridColumn: "span 1" }} className="hidden md:block">
                            {result ? (
                                <FilterSidebar
                                    result={result}
                                    filters={filters}
                                    onSortChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}
                                    onToggleCompany={toggleCompany}
                                    onToggleTimeRange={toggleTimeRange}
                                    onToggleAmenity={toggleAmenity}
                                    onPriceChange={(field, value) =>
                                        setFilters((current) => ({ ...current, [field]: value.replace(/[^\d]/g, "") }))
                                    }
                                    onReset={() => setFilters(DEFAULT_FILTERS)}
                                />
                            ) : (
                                <Card size="3">
                                    <Flex direction="column" gap="3">
                                        <Skeleton height="24px" width="50%" />
                                        <Skeleton height="18px" width="100%" />
                                        <Skeleton height="18px" width="100%" />
                                        <Skeleton height="18px" width="80%" />
                                    </Flex>
                                </Card>
                            )}
                        </Box>
                        <Box style={{ gridColumn: "span 3" }}>
                            <Heading size="5" mb="4" highContrast>
                                {result
                                    ? t("search:page_title_result", {
                                          destination: result.summary?.destination?.displayName ?? "",
                                          origin: result.summary?.origin?.displayName ?? "",
                                      })
                                    : t("search:page_loading")}
                            </Heading>

                            {loading ? (
                                <SearchPageSkeleton />
                            ) : error ? (
                                <Card size="3">
                                    <Flex direction="column" gap="3" align="center" py="6">
                                        <Text size="4" weight="bold">
                                            {t("search:page_error_title")}
                                        </Text>
                                        <Text size="2" color="gray">
                                            {error}
                                        </Text>
                                        <Button onClick={() => navigate("/")}>{t("search:page_error_back")}</Button>
                                    </Flex>
                                </Card>
                            ) : result && result.items?.length ? (
                                <Flex direction="column" gap="4">
                                    {result.items.map((ticket) => (
                                        <TicketCard
                                            key={ticket.tripId}
                                            ticket={ticket}
                                            onShowDetail={(tripId) => setSelectedTripId(tripId)}
                                            onSelectTrip={(tripId) => navigate(`/booking/${tripId}`)}
                                        />
                                    ))}
                                </Flex>
                            ) : (
                                <Card size="3">
                                    <Flex direction="column" gap="3" align="center" py="6">
                                        <Search size={96} color="gray" />
                                        <Heading size="6" weight="bold">
                                            {t("search:page_no_results_title")}
                                        </Heading>
                                        <Text size="2" color="gray" align="center">
                                            {t("search:page_no_results_desc")}
                                        </Text>
                                    </Flex>
                                </Card>
                            )}
                        </Box>
                    </Grid>
                </Container>
            </Box>

            <TripDetailDialog tripId={selectedTripId} onClose={() => setSelectedTripId(null)} />
        </Box>
    );
});

export default PageMainSearch;
