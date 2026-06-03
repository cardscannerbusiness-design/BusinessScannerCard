import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { QueueBarPoint } from "@/lib/queueAnalytics";

const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "var(--shadow-soft)",
};

export function QueueSaveBarChart({
  data,
  tooltipLabel = "Saved on device",
}: {
  data: QueueBarPoint[];
  tooltipLabel?: string;
}) {
  return (
    <div className="h-52 w-full sm:h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={data.length > 12 ? 2 : 0}
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [value ?? 0, tooltipLabel]}
          />
          <Bar
            dataKey="count"
            name={tooltipLabel}
            fill="oklch(0.54 0.22 277)"
            radius={[6, 6, 0, 0]}
            background={{ fill: "rgba(180, 180, 180, 0.2)", radius: 6 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
