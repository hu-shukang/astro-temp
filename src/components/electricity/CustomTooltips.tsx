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

export function CustomMonthlyTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
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

export function CustomDailyTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
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
