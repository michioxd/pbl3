"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { IconButton, Popover, TextField } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

import { Calendar } from "@/components/ui/calendar";

function formatDate(date: Date | undefined) {
    if (!date) {
        return "";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${day}-${month}-${date.getFullYear()}`;
}

function parseDate(value: string) {
    const match = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (!match) {
        return undefined;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsedDate = new Date(year, month - 1, day);

    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
        return undefined;
    }

    return parsedDate;
}

type DatePickerInputProps = {
    date?: Date;
    setDate?: React.Dispatch<React.SetStateAction<Date | undefined>>;
    onDateChange?: (date: Date | undefined) => void;
    minDate?: Date;
    inputProps?: TextField.RootProps;
};

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function DatePickerInput({ date, setDate, onDateChange, minDate, inputProps }: DatePickerInputProps) {
    const { t } = useTranslation("common");
    const [open, setOpen] = React.useState(false);
    const [internalDate, setInternalDate] = React.useState<Date | undefined>(date ?? new Date());
    const currentDate = date ?? internalDate;
    const [month, setMonth] = React.useState<Date | undefined>(currentDate);
    const [value, setValue] = React.useState(formatDate(currentDate));

    const {
        id,
        size,
        className,
        onChange: inputOnChange,
        onKeyDown: inputOnKeyDown,
        onPointerDown: inputOnPointerDown,
        value: ignoredValue,
        defaultValue: ignoredDefaultValue,
        ...restInputProps
    } = inputProps ?? {};

    void ignoredValue;
    void ignoredDefaultValue;

    const updateDate = React.useCallback(
        (nextDate: Date | undefined) => {
            if (nextDate && minDate && startOfDay(nextDate) < startOfDay(minDate)) {
                return;
            }

            if (setDate) {
                setDate(nextDate);
            } else {
                setInternalDate(nextDate);
            }

            onDateChange?.(nextDate);
        },
        [minDate, onDateChange, setDate],
    );

    React.useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(formatDate(currentDate));
        if (currentDate) {
            setMonth(currentDate);
        }
    }, [currentDate]);

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger>
                <div>
                    <TextField.Root
                        {...restInputProps}
                        id={id ?? "date-required"}
                        size={size ?? "3"}
                        className={["mx-auto", className].filter(Boolean).join(" ")}
                        value={value}
                        placeholder="01-06-2025"
                        onPointerDown={(e) => {
                            inputOnPointerDown?.(e);
                            if (e.defaultPrevented) {
                                return;
                            }
                        }}
                        onChange={(e) => {
                            inputOnChange?.(e);
                            if (e.defaultPrevented) {
                                return;
                            }

                            const nextValue = e.target.value;
                            const parsedDate = parseDate(nextValue);

                            setValue(nextValue);
                            if (parsedDate) {
                                updateDate(parsedDate);
                                setMonth(parsedDate);
                            }
                        }}
                        onKeyDown={(e) => {
                            inputOnKeyDown?.(e);
                            if (e.defaultPrevented) {
                                return;
                            }

                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setOpen(true);
                            }
                        }}
                    >
                        <TextField.Slot side="right">
                            <IconButton id="date-picker" variant="ghost" size="1" aria-label={t("select_date")}>
                                <CalendarIcon size={16} />
                                <span className="sr-only">{t("select_date")}</span>
                            </IconButton>
                        </TextField.Slot>
                    </TextField.Root>
                </div>
            </Popover.Trigger>
            <Popover.Content
                size="1"
                className="w-auto overflow-hidden p-0"
                align="end"
                alignOffset={-8}
                sideOffset={10}
                data-slot="card-content"
            >
                <Calendar
                    mode="single"
                    selected={currentDate}
                    month={month}
                    disabled={minDate ? { before: startOfDay(minDate) } : undefined}
                    onMonthChange={setMonth}
                    onSelect={(date) => {
                        updateDate(date);
                        setValue(formatDate(date));
                        setOpen(false);
                    }}
                />
            </Popover.Content>
        </Popover.Root>
    );
}
