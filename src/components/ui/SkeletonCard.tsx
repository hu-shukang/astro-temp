interface SkeletonCardProps {
  lines?: number;
  showTitle?: boolean;
}

export default function SkeletonCard({
  lines = 3,
  showTitle = true,
}: SkeletonCardProps) {
  return (
    <div className="bg-surface border-border animate-pulse rounded-xl border p-6">
      {showTitle && <div className="bg-border mb-4 h-4 w-1/3 rounded" />}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`bg-border h-3 rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-surface border-border animate-pulse rounded-xl border p-6">
      <div className="bg-border mb-2 h-3 w-1/2 rounded" />
      <div className="bg-border mb-3 h-10 w-2/3 rounded" />
      <div className="bg-border h-4 w-1/3 rounded" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface border-border animate-pulse rounded-xl border p-6">
      <div className="bg-border mb-4 h-4 w-1/4 rounded" />
      <div className="flex items-end gap-2" style={{ height: 200 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-border flex-1 rounded-t"
            style={{ height: `${30 + ((i * 17) % 70)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
