import type { AdminDashboardDailyStatDto } from "@/api";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const compactCurrencyFormatter = new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");
type TooltipValue = number | string | Array<number | string> | undefined;

function toNumericValue(value: TooltipValue) {
    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    if (Array.isArray(value)) {
        return toNumericValue(value[0]);
    }

    return 0;
}

export function AnalyticsChart({ data }: { data: AdminDashboardDailyStatDto[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                />
                <YAxis
                    yAxisId="left"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => numberFormatter.format(value)}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => compactCurrencyFormatter.format(value)}
                />
                <Tooltip
                    formatter={(value, name) => {
                        const numericValue = toNumericValue(value as TooltipValue);

                        if (name === "revenue") {
                            return [
                                new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    maximumFractionDigits: 0,
                                }).format(numericValue),
                                "Doanh thu",
                            ] as const;
                        }

                        if (name === "cancelledTickets") {
                            return [numberFormatter.format(numericValue), "Vé hủy"] as const;
                        }

                        return [numberFormatter.format(numericValue), "Vé bán"] as const;
                    }}
                    labelFormatter={(label) => `Ngày ${label}`}
                    wrapperClassName="bg-background/80! border border-border/60! rounded-md! p-2! backdrop-blur-lg!"
                />
                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="soldTickets"
                    stroke="currentColor"
                    className="text-primary"
                    fill="currentColor"
                    fillOpacity={0.2}
                />
                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cancelledTickets"
                    stroke="currentColor"
                    className="text-destructive"
                    fill="currentColor"
                    fillOpacity={0.08}
                />
                <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="currentColor"
                    className="text-muted-foreground"
                    fill="currentColor"
                    fillOpacity={0.06}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
