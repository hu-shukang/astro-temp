import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockMonthlyUsage } from "../../store/mockData";
import { SkeletonChart } from "../ui/SkeletonCard";
import { YoYCard } from "../ui/YoYCard";
import { CustomMonthlyTooltip } from "./CustomTooltips";

interface MonthlyViewProps {
  contractId: string;
  isLoading: boolean;
}

export function MonthlyView({ contractId, isLoading }: MonthlyViewProps) {
  // 今年: 2025/4 〜 2026/3  前年: 2024/4 〜 2025/3
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const totalMonths = 2025 * 12 + 3 + i; // 2025年4月起点
      const year = Math.floor(totalMonths / 12);
      const month = totalMonths % 12 || 12;
      const adjustedYear = month === 12 ? year - 1 : year;

      const prevTotalMonths = totalMonths - 12;
      const prevYear = Math.floor(prevTotalMonths / 12);
      const prevMonth = prevTotalMonths % 12 || 12;
      const prevAdjustedYear = prevMonth === 12 ? prevYear - 1 : prevYear;

      const currentRec = mockMonthlyUsage.find(
        (u) =>
          u.contractId === contractId &&
          u.year === adjustedYear &&
          u.month === month,
      );
      const prevRec = mockMonthlyUsage.find(
        (u) =>
          u.contractId === contractId &&
          u.year === prevAdjustedYear &&
          u.month === prevMonth,
      );

      months.push({
        label: `${adjustedYear === 2025 ? "25" : "26"}/${String(month).padStart(2, "0")}`,
        今年: currentRec ? (currentRec.forecastKwh ?? currentRec.kwh) : 0,
        前年: prevRec ? prevRec.kwh : 0,
        isForecast: !!currentRec?.forecastKwh,
      });
    }
    return months;
  }, [contractId]);

  // 今月（2026/3）の予測データ
  const forecastRec = mockMonthlyUsage.find(
    (u) => u.contractId === contractId && u.year === 2026 && u.month === 3,
  );
  const currentMonthActual = forecastRec?.kwh ?? 0;
  const forecastKwh = forecastRec?.forecastKwh ?? 0;
  const forecastAmount = forecastRec?.forecastAmount ?? 0;

  // YoY: 今年3月 vs 前年3月
  const currentMarchRec = mockMonthlyUsage.find(
    (u) => u.contractId === contractId && u.year === 2026 && u.month === 3,
  );
  const prevMarchRec = mockMonthlyUsage.find(
    (u) => u.contractId === contractId && u.year === 2025 && u.month === 3,
  );

  if (isLoading) return <SkeletonChart />;

  return (
    <div className="space-y-4">
      {/* グラフ */}
      <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
        <h3 className="text-text mb-4 text-sm font-semibold">
          月別使用量（過去12ヶ月）
        </h3>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 480 }}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  unit=" kWh"
                  width={70}
                />
                <Tooltip
                  content={<CustomMonthlyTooltip />}
                  cursor={{ fill: "rgba(37,99,235,0.05)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar
                  dataKey="今年"
                  fill="#2563EB"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  dataKey="前年"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#F97316" }}
                  activeDot={{ r: 5 }}
                  type="monotone"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 今月の予測 */}
      {forecastKwh > 0 && (
        <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
          <h3 className="text-text mb-3 text-sm font-semibold">今月の予測</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-text-muted text-xs">現在の使用量</p>
              <p className="font-heading text-text text-xl font-bold">
                {currentMonthActual.toLocaleString()}
                <span className="text-text-muted ml-1 text-sm font-normal">
                  kWh
                </span>
              </p>
            </div>
            <div className="text-text-muted flex items-end pb-1 text-sm">→</div>
            <div>
              <p className="text-text-muted text-xs">月末予測</p>
              <p className="font-heading text-primary text-xl font-bold">
                {forecastKwh.toLocaleString()}
                <span className="ml-1 text-sm font-normal">kWh</span>
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs">予測電気代</p>
              <p className="font-heading text-warning text-xl font-bold">
                ¥{forecastAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* YoYカード */}
      {currentMarchRec && prevMarchRec && (
        <YoYCard
          currentValue={currentMarchRec.forecastKwh ?? currentMarchRec.kwh}
          previousValue={prevMarchRec.kwh}
          unit="kWh"
          label="前年同月比（3月）"
        />
      )}
    </div>
  );
}
