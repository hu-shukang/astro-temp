import clsx from "clsx";
import { ArrowDownIcon, ArrowUpIcon } from "./Icons";

interface YoYCardProps {
  currentValue: number;
  previousValue: number;
  unit: string;
  label?: string;
  formatValue?: (v: number) => string;
}

export function YoYCard({
  currentValue,
  previousValue,
  unit,
  label = "前年同月比",
  formatValue,
}: YoYCardProps) {
  const diff = currentValue - previousValue;
  const pct =
    previousValue > 0 ? ((diff / previousValue) * 100).toFixed(1) : "0.0";
  const isIncrease = diff > 0;
  const isDecrease = diff < 0;

  const fmt = formatValue ?? ((v: number) => v.toLocaleString());

  return (
    <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
      <p className="text-text-muted mb-3 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-6">
        <div>
          <p className="text-text-muted text-xs">今年</p>
          <p className="font-heading text-text text-2xl font-bold">
            {fmt(currentValue)}
            <span className="text-text-muted ml-1 text-sm font-normal">
              {unit}
            </span>
          </p>
        </div>
        <div className="text-text-muted text-sm">vs</div>
        <div>
          <p className="text-text-muted text-xs">前年</p>
          <p className="font-heading text-text-muted text-2xl font-bold">
            {fmt(previousValue)}
            <span className="ml-1 text-sm font-normal">{unit}</span>
          </p>
        </div>
        <div
          className={clsx(
            "ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
            isIncrease && "bg-danger-light text-danger",
            isDecrease && "bg-success-light text-success",
            !isIncrease && !isDecrease && "bg-border text-text-muted",
          )}
        >
          {isIncrease && <ArrowUpIcon className="h-3.5 w-3.5" />}
          {isDecrease && <ArrowDownIcon className="h-3.5 w-3.5" />}
          <span>
            {isIncrease ? "+" : ""}
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}
