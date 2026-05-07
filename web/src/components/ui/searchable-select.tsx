import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Chọn...",
}: {
    options: { id: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const selectedOption = options.find((opt) => opt.id === value);
    const displayValue = selectedOption ? selectedOption.label : value;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">{displayValue || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput 
                        placeholder="Tìm kiếm hoặc nhập ID..." 
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
                                    Sử dụng ID: <span className="font-mono ml-1">{searchValue}</span>
                                </Button>
                            ) : (
                                "Không tìm thấy kết quả."
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
                                            value === option.id ? "opacity-100" : "opacity-0"
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
