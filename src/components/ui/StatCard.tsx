import clsx from "clsx";
import { ArrowDownIcon, ArrowUpIcon } from "./Icons";
import { SkeletonStatCard } from "./SkeletonCard";

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  changePercent?: number;
  changeLabel?: string;
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  changePercent,
  changeLabel = "前月比",
  isLoading,
}: StatCardProps) {
  if (isLoading) return <SkeletonStatCard />;

  const isIncrease = changePercent !== undefined && changePercent > 0;
  const isDecrease = changePercent !== undefined && changePercent < 0;

  return (
    <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
      <p className="text-text-muted text-sm font-medium">{label}</p>
      <p className="font-heading text-text mt-2 text-3xl font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}
        <span className="text-text-muted ml-1 text-base font-normal">
          {unit}
        </span>
      </p>
      {changePercent !== undefined && (
        <div
          className={clsx(
            "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            isIncrease && "bg-danger-light text-danger",
            isDecrease && "bg-success-light text-success",
            !isIncrease && !isDecrease && "bg-border text-text-muted",
          )}
        >
          {isIncrease && <ArrowUpIcon className="h-3 w-3" />}
          {isDecrease && <ArrowDownIcon className="h-3 w-3" />}
          <span>
            {changeLabel} {changePercent > 0 ? "+" : ""}
            {changePercent.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
