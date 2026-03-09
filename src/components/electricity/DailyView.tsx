import { useMemo, useState } from "react";
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
import { mockDailyUsage } from "../../store/mockData";
import { ChevronLeftIcon, ChevronRightIcon } from "../ui/Icons";
import { SkeletonChart } from "../ui/SkeletonCard";
import { CustomDailyTooltip } from "./CustomTooltips";

interface DailyViewProps {
  contractId: string;
  isLoading: boolean;
}

export function DailyView({ contractId, isLoading }: DailyViewProps) {
  // 表示月: 初期値は最新データのある2026/3
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(3);

  const TODAY_YEAR = 2026;
  const TODAY_MONTH = 3;
  const isNextDisabled =
    viewYear > TODAY_YEAR ||
    (viewYear === TODAY_YEAR && viewMonth >= TODAY_MONTH);

  function prevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (isNextDisabled) return;
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const chartData = useMemo(() => {
    const prevYearActual = viewYear - 1;
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const data = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const currentRec = mockDailyUsage.find(
        (u) =>
          u.contractId === contractId &&
          u.year === viewYear &&
          u.month === viewMonth &&
          u.day === d,
      );
      const prevRec = mockDailyUsage.find(
        (u) =>
          u.contractId === contractId &&
          u.year === prevYearActual &&
          u.month === viewMonth &&
          u.day === d,
      );

      data.push({
        label: d,
        今年: currentRec?.kwh ?? null,
        前年同月: prevRec?.kwh ?? null,
      });
    }
    return data;
  }, [contractId, viewYear, viewMonth]);

  // 月間合計・平均
  const { total, avg } = useMemo(() => {
    const values = chartData
      .map((d) => d["今年"])
      .filter((v): v is number => v !== null);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      total: parseFloat(sum.toFixed(1)),
      avg: values.length > 0 ? parseFloat((sum / values.length).toFixed(1)) : 0,
    };
  }, [chartData]);

  if (isLoading) return <SkeletonChart />;

  return (
    <div className="space-y-4">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="border-border bg-surface hover:border-primary flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          aria-label="前月"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h3 className="text-text font-semibold">
          {viewYear}年{viewMonth}月
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          disabled={isNextDisabled}
          className="border-border bg-surface hover:border-primary flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="次月"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* グラフ */}
      <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 600 }}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  unit=" kWh"
                  width={70}
                />
                <Tooltip
                  content={<CustomDailyTooltip />}
                  cursor={{ fill: "rgba(37,99,235,0.05)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar
                  dataKey="今年"
                  fill="#2563EB"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                />
                <Line
                  dataKey="前年同月"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#F97316" }}
                  activeDot={{ r: 4 }}
                  type="monotone"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 月間サマリー */}
      <div className="border-border bg-surface grid grid-cols-2 divide-x rounded-xl border shadow-sm">
        <div className="p-5">
          <p className="text-text-muted text-xs font-medium">月間合計</p>
          <p className="font-heading text-text mt-1 text-2xl font-bold">
            {total.toLocaleString()}
            <span className="text-text-muted ml-1 text-sm font-normal">
              kWh
            </span>
          </p>
        </div>
        <div className="p-5">
          <p className="text-text-muted text-xs font-medium">1日平均</p>
          <p className="font-heading text-text mt-1 text-2xl font-bold">
            {avg}
            <span className="text-text-muted ml-1 text-sm font-normal">
              kWh/日
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
