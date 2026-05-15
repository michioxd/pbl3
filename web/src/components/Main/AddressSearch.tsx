import { getApiLandingProvincesSearch, type ProvinceResponse } from "@/api";
import {
    Box,
    Button,
    Flex,
    IconButton,
    Popover,
    ScrollArea,
    Separator,
    Spinner,
    Text,
    TextField,
} from "@radix-ui/themes";
import { MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface SelectedAddress {
    provinceId: string;
    districtId?: string;
    wardId?: string;
}

export default function AddressSearch({
    inputProps,
    text,
    setText,
    setSelected,
}: {
    inputProps?: TextField.RootProps;
    text?: string;
    setText?: (text: string) => void;
    setSelected?: (address: SelectedAddress | null) => void;
}) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const [txt, setTxt] = useState("");
    const [loading, setLoading] = useState(false);
    const [res, setRes] = useState<ProvinceResponse[] | null>(null);
    const [, setSelectedBt] = useState<SelectedAddress | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isVietnamese = i18n.language.toLowerCase().startsWith("vi");

    const getDisplayName = useCallback(
        (item: { name?: string | null; name_en?: string | null }) => {
            if (isVietnamese) {
                return item.name ?? "";
            }

            return item.name_en || item.name || "";
        },
        [isVietnamese],
    );

    const handleSelect = useCallback(
        (address: SelectedAddress, displayText: string) => {
            (setSelected ?? setSelectedBt)(address);
            (setText ?? setTxt)(displayText);
            setOpen(false);
        },
        [setSelected, setText],
    );

    const handleProvinceSearch = useCallback(async (query: string) => {
        if (query.trim() === "") {
            setRes(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const searchPromise = await getApiLandingProvincesSearch({
                query: {
                    query: query,
                },
            });
            if (searchPromise.error || !searchPromise.data) {
                console.error("Error searching provinces:", searchPromise.error);
                setRes(null);
                return;
            }
            setRes(searchPromise.data);
        } catch (e) {
            console.error("Error searching provinces:", e);
            setRes(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            handleProvinceSearch(text ?? txt);
        }, 500);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [txt, handleProvinceSearch, text]);

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger>
                <div>
                    <TextField.Root
                        {...inputProps}
                        ref={inputRef}
                        size={inputProps?.size ?? "3"}
                        className={["mx-auto", inputProps?.className].filter(Boolean).join(" ")}
                        value={text ?? txt}
                        placeholder={inputProps?.placeholder ?? "Nhập địa điểm"}
                        onChange={(e) => {
                            (setText ?? setTxt)(e.target.value);
                        }}
                    >
                        <TextField.Slot side="left">
                            <IconButton variant="ghost" size="2">
                                <MapPin size={18} />
                            </IconButton>
                        </TextField.Slot>
                    </TextField.Root>
                </div>
            </Popover.Trigger>
            <Popover.Content
                size="1"
                className="w-auto overflow-hidden p-0"
                align="start"
                alignOffset={0}
                sideOffset={8}
                data-slot="card-content"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ScrollArea type="auto" scrollbars="vertical" className="max-h-96">
                    <Box p="2">
                        {loading ? (
                            <Flex align="center" justify="center" py="4">
                                <Spinner size="3" />
                            </Flex>
                        ) : res && res.length > 0 ? (
                            <Flex direction="column" gap="1">
                                {res.map((province, provinceIndex) => {
                                    const hasDistricts = province.districts && province.districts.length > 0;

                                    return (
                                        <div key={province.id}>
                                            {provinceIndex > 0 && <Separator size="4" my="2" />}
                                            <div className="flex flex-col gap-0.5">
                                                {hasDistricts && (
                                                    <Button
                                                        size="2"
                                                        className="w-full! justify-start!"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleSelect(
                                                                { provinceId: province.id ?? "" },
                                                                getDisplayName(province),
                                                            )
                                                        }
                                                    >
                                                        <Text size="2" weight="bold">
                                                            {getDisplayName(province)}
                                                        </Text>
                                                    </Button>
                                                )}

                                                {!hasDistricts && (
                                                    <Button
                                                        size="2"
                                                        className="w-full! justify-start!"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleSelect(
                                                                { provinceId: province.id ?? "" },
                                                                getDisplayName(province),
                                                            )
                                                        }
                                                    >
                                                        <Text size="2">{getDisplayName(province)}</Text>
                                                    </Button>
                                                )}

                                                {hasDistricts &&
                                                    province.districts!.map((district) => {
                                                        const hasWards = district.wards && district.wards.length > 0;

                                                        return (
                                                            <div
                                                                key={district.id}
                                                                className="ml-4 flex flex-col gap-0.5"
                                                            >
                                                                {hasWards && (
                                                                    <Button
                                                                        size="2"
                                                                        className="w-full! justify-start! flex! gap-2! mb-0.2!"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            handleSelect(
                                                                                {
                                                                                    provinceId: province.id ?? "",
                                                                                    districtId:
                                                                                        district.id ?? undefined,
                                                                                },
                                                                                `${getDisplayName(district)}, ${getDisplayName(province)}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Text
                                                                            size="2"
                                                                            weight="medium"
                                                                            className="text-nowrap!"
                                                                        >
                                                                            {getDisplayName(district)}
                                                                        </Text>
                                                                        <Separator className="w-full!" />
                                                                    </Button>
                                                                )}

                                                                {!hasWards && (
                                                                    <Button
                                                                        size="2"
                                                                        className="w-full! justify-start!"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            handleSelect(
                                                                                {
                                                                                    provinceId: province.id ?? "",
                                                                                    districtId:
                                                                                        district.id ?? undefined,
                                                                                },
                                                                                `${getDisplayName(district)}, ${getDisplayName(province)}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Text size="2">{getDisplayName(district)}</Text>
                                                                    </Button>
                                                                )}

                                                                {hasWards &&
                                                                    district.wards!.map((ward) => (
                                                                        <Button
                                                                            key={ward.id}
                                                                            size="2"
                                                                            className="w-full! justify-start! ml-4"
                                                                            variant="ghost"
                                                                            onClick={() =>
                                                                                handleSelect(
                                                                                    {
                                                                                        provinceId: province.id ?? "",
                                                                                        districtId:
                                                                                            district.id ?? undefined,
                                                                                        wardId: ward.id ?? undefined,
                                                                                    },
                                                                                    `${getDisplayName(ward)}, ${getDisplayName(district)}, ${getDisplayName(province)}`,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Text size="2" color="gray">
                                                                                {getDisplayName(ward)}
                                                                            </Text>
                                                                        </Button>
                                                                    ))}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </Flex>
                        ) : (text ?? txt).trim() !== "" ? (
                            <Text size="2" color="gray" className="block p-2 text-center">
                                {t("common:no_results_found")}
                            </Text>
                        ) : (
                            <Text size="2" color="gray" className="block p-2 text-center">
                                {t("common:please_enter_address")}
                            </Text>
                        )}
                    </Box>
                </ScrollArea>
            </Popover.Content>
        </Popover.Root>
    );
}
