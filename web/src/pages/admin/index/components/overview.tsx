import type { AdminDashboardMonthlyStatDto } from "@/api";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

export function Overview({ data }: { data: AdminDashboardMonthlyStatDto[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} barCategoryGap={18}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                    yAxisId="left"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => compactCurrencyFormatter.format(value)}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
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

                        return [numberFormatter.format(numericValue), "Vé bán"] as const;
                    }}
                    labelFormatter={(label) => `Kỳ ${label}`}
                    wrapperClassName="bg-background/80! border border-border/60! rounded-md! p-2! backdrop-blur-lg!"
                />
                <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="currentColor"
                    radius={[6, 6, 0, 0]}
                    className="fill-primary"
                />
                <Bar
                    yAxisId="right"
                    dataKey="soldTickets"
                    fill="currentColor"
                    radius={[6, 6, 0, 0]}
                    className="fill-muted-foreground/50"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
