import { getApiLandingProvincesSearch, type ProvinceResponse } from "@/api";
import { Box, Button, Flex, IconButton, Popover, ScrollArea, Spinner, Text, TextField } from "@radix-ui/themes";
import { MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function AddressSearch({ inputProps }: { inputProps?: TextField.RootProps }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [txt, setTxt] = useState("");
    const [loading, setLoading] = useState(false);
    const [res, setRes] = useState<ProvinceResponse[] | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleProvinceSearch = useCallback(async (query: string) => {
        if (query.trim() === "") {
            setRes(null);
            setOpen(false);
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
                return;
            }
            setRes(searchPromise.data);
            setOpen(true);
        } catch (e) {
            console.error("Error searching provinces:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            handleProvinceSearch(txt);
        }, 500);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [txt, handleProvinceSearch]);

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <TextField.Root
                {...inputProps}
                ref={inputRef}
                size={inputProps?.size ?? "3"}
                className={["mx-auto", inputProps?.className].filter(Boolean).join(" ")}
                value={txt}
                placeholder={inputProps?.placeholder ?? "Nhập địa điểm"}
                onChange={(e) => {
                    setTxt(e.target.value);
                }}
                onFocus={() => {
                    // if (res && res.length > 0) {
                    //     setOpen(true);
                    // }
                }}
            >
                <TextField.Slot side="left">
                    <Popover.Trigger>
                        <IconButton variant="ghost" size="2">
                            <MapPin size={18} />
                        </IconButton>
                    </Popover.Trigger>
                </TextField.Slot>
            </TextField.Root>
            <Popover.Content
                size="1"
                className="w-auto overflow-hidden p-0"
                align="start"
                alignOffset={0}
                sideOffset={8}
                data-slot="card-content"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ScrollArea
                    type="auto"
                    scrollbars="vertical"
                    style={{ maxHeight: 300, width: inputRef.current?.offsetWidth ?? 300 }}
                >
                    <Box p="2">
                        {loading ? (
                            <Text size="2" color="gray" className="p-2 flex items-center justify-center">
                                <Spinner size="3" />
                            </Text>
                        ) : res && res.length > 0 ? (
                            <Flex direction="column" gap="1">
                                {res.map((province) => (
                                    <div key={province.id} className="flex flex-col">
                                        <Text size="2" className="block pb-1" color="gray">
                                            {province.name}
                                        </Text>
                                        {province.districts?.map((district) => (
                                            <div key={district.id} className="flex flex-col">
                                                {district.wards?.length ? (
                                                    district.wards.map((ward) => (
                                                        <Button
                                                            key={ward.id}
                                                            size="3"
                                                            className="text-right! w-full! justify-start! mb-1!"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setTxt(
                                                                    `${ward.name}, ${district.name}, ${province.name}`,
                                                                );
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <Text size="2">
                                                                {ward.name}, {district.name}
                                                            </Text>
                                                        </Button>
                                                    ))
                                                ) : (
                                                    <Button
                                                        key={district.id}
                                                        size="3"
                                                        className="text-right! w-full! justify-start! mb-1!"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setTxt(`${district.name}, ${province.name}`);
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Text size="2">{district.name}</Text>
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </Flex>
                        ) : txt.trim() !== "" ? (
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
