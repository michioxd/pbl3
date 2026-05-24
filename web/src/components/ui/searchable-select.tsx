import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
}: {
    options: { id: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const { t } = useTranslation("common");
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const selectedOption = options.find((opt) => opt.id === value);
    const displayValue = selectedOption ? selectedOption.label : value;
    const resolvedPlaceholder = placeholder ?? t("select_placeholder");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">{displayValue || resolvedPlaceholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={t("search_or_enter_id")}
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {searchValue ? (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm font-normal"
                                    onClick={() => {
                                        onChange(searchValue);
                                        setOpen(false);
                                        setSearchValue("");
                                    }}
                                >
                                    {t("use_id", { value: searchValue })}
                                </Button>
                            ) : (
                                t("no_results_found")
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={`${option.id} ${option.label}`}
                                    onSelect={() => {
                                        onChange(option.id);
                                        setOpen(false);
                                        setSearchValue("");
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            value === option.id ? "opacity-100" : "opacity-0",
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
