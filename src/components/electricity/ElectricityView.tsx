import { useEffect, useMemo, useState } from "react";
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
import { useContractStore } from "../../store/contractStore";
import { mockDailyUsage, mockMonthlyUsage } from "../../store/mockData";
import { ContractSelector } from "../ui/ContractSelector";
import { ChevronLeftIcon, ChevronRightIcon } from "../ui/Icons";
import { SkeletonChart } from "../ui/SkeletonCard";
import { YoYCard } from "../ui/YoYCard";

// ─── 型 ─────────────────────────────────────────────────────────────────────

type ViewMode = "monthly" | "daily";

// ─── カスタムTooltip ─────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomMonthlyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const current = payload.find((p) => p.name === "今年");
  const prev = payload.find((p) => p.name === "前年");
  const diff = current && prev ? current.value - prev.value : null;
  const pct =
    diff !== null && prev && prev.value > 0
      ? ((diff / prev.value) * 100).toFixed(1)
      : null;

  return (
    <div className="border-border bg-surface rounded-lg border p-3 text-sm shadow-lg">
      <p className="text-text mb-2 font-semibold">{label}</p>
      {current && (
        <p className="text-text flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: current.color }}
          />
          今年: {current.value.toLocaleString()} kWh
        </p>
      )}
      {prev && (
        <p className="text-text flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: prev.color }}
          />
          前年: {prev.value.toLocaleString()} kWh
        </p>
      )}
      {diff !== null && pct !== null && (
        <p
          className={`mt-1 font-medium ${diff > 0 ? "text-danger" : diff < 0 ? "text-success" : "text-text-muted"}`}
        >
          差分: {diff > 0 ? "+" : ""}
          {diff.toLocaleString()} kWh ({diff > 0 ? "+" : ""}
          {pct}%)
        </p>
      )}
    </div>
  );
}

function CustomDailyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const current = payload.find((p) => p.name === "今年");
  const prev = payload.find((p) => p.name === "前年同月");

  return (
    <div className="border-border bg-surface rounded-lg border p-3 text-sm shadow-lg">
      <p className="text-text mb-2 font-semibold">{label}日</p>
      {current && (
        <p className="text-text flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: current.color }}
          />
          今年: {current.value} kWh
        </p>
      )}
      {prev && (
        <p className="text-text flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: prev.color }}
          />
          前年同月: {prev.value} kWh
        </p>
      )}
    </div>
  );
}

// ─── 月別ビュー ──────────────────────────────────────────────────────────────

interface MonthlyViewProps {
  contractId: string;
  isLoading: boolean;
}

function MonthlyView({ contractId, isLoading }: MonthlyViewProps) {
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

// ─── 日別ビュー ──────────────────────────────────────────────────────────────

interface DailyViewProps {
  contractId: string;
  isLoading: boolean;
}

function DailyView({ contractId, isLoading }: DailyViewProps) {
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
    // 前年同月
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

// ─── メインコンポーネント ────────────────────────────────────────────────────

export function ElectricityView() {
  const selectedId = useContractStore((s) => s.selectedContractId);
  const isLoading = useContractStore((s) => s.isLoading);
  const contracts = useContractStore((s) => s.contracts);
  const contractId = selectedId ?? contracts[0]?.id ?? "";

  // URLクエリパラメータからビューモードを読み取る
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view");
      return v === "daily" ? "daily" : "monthly";
    }
    return "monthly";
  });

  // ビュー切り替え時にURLを更新
  function handleViewChange(newView: ViewMode) {
    setView(newView);
    const url = new URL(window.location.href);
    url.searchParams.set("view", newView);
    window.history.replaceState({}, "", url.toString());
  }

  // popstate でブラウザ戻る/進むに対応
  useEffect(() => {
    function onPop() {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view");
      setView(v === "daily" ? "daily" : "monthly");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-text text-2xl font-semibold">
          電気使用量
        </h1>
        <ContractSelector />
      </div>

      {/* Segmented Controls */}
      <div className="border-border bg-surface inline-flex rounded-lg border p-1 shadow-sm">
        {(["monthly", "daily"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleViewChange(mode)}
            className={`rounded-md px-5 py-1.5 text-sm font-medium transition-colors ${
              view === mode
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            {mode === "monthly" ? "月別" : "日別"}
          </button>
        ))}
      </div>

      {/* コンテンツエリア */}
      {view === "monthly" ? (
        <MonthlyView contractId={contractId} isLoading={isLoading} />
      ) : (
        <DailyView contractId={contractId} isLoading={isLoading} />
      )}
    </div>
  );
}
