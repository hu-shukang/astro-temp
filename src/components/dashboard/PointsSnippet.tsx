import { usePointStore } from "../../store/pointStore";
import {
  ChevronRightIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from "../ui/Icons";

export function PointsSnippet() {
  const balance = usePointStore((s) => s.balance);
  const expiringPoints = usePointStore((s) => s.expiringPoints);
  const expiringDate = usePointStore((s) => s.expiringDate);

  const formattedExpiry = expiringDate
    ? new Date(expiringDate).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-text flex items-center gap-2 text-base font-semibold">
          <StarIcon className="text-warning h-5 w-5" />
          ポイント残高
        </h2>
        <a
          href="/points"
          className="text-primary hover:text-primary-hover flex items-center gap-0.5 text-sm font-medium transition-colors"
        >
          詳細を見る
          <ChevronRightIcon className="h-4 w-4" />
        </a>
      </div>

      <p className="font-heading text-text text-3xl font-bold">
        {balance.toLocaleString()}
        <span className="text-text-muted ml-1 text-base font-normal">P</span>
      </p>

      <a
        href="/points"
        className="bg-cta hover:bg-cta-hover mt-3 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
      >
        使用する
        <ChevronRightIcon className="h-4 w-4" />
      </a>

      {expiringPoints > 0 && formattedExpiry && (
        <div className="bg-warning-light mt-4 flex items-start gap-2 rounded-lg p-3">
          <ExclamationTriangleIcon className="text-warning mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-warning text-xs font-medium">
            {expiringPoints.toLocaleString()}P が {formattedExpiry} に失効します
          </p>
        </div>
      )}
    </div>
  );
}
