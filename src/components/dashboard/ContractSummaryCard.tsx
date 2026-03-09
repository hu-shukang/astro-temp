import clsx from "clsx";
import type { Contract } from "../../types";
import { ChevronRightIcon } from "../ui/Icons";

interface ContractSummaryCardProps {
  contract: Contract;
  currentKwh: number;
  currentAmount: number;
  /** trueのとき横幅いっぱいの詳細表示（パターンB） */
  expanded?: boolean;
}

export function ContractSummaryCard({
  contract,
  currentKwh,
  currentAmount,
  expanded = false,
}: ContractSummaryCardProps) {
  return (
    <div
      className={clsx(
        "border-border bg-surface rounded-xl border p-5 shadow-sm",
        expanded && "w-full",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-text text-sm font-medium">{contract.address}</p>
          <p className="text-text-muted mt-0.5 text-xs">
            {contract.planName} &nbsp;{contract.ampere}A
          </p>
        </div>
        <span className="bg-success-light text-success rounded-full px-2 py-0.5 text-xs font-medium">
          契約中
        </span>
      </div>

      {expanded ? (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-background rounded-lg p-3">
            <p className="text-text-muted text-xs">今月の使用量</p>
            <p className="font-heading text-text mt-1 text-xl font-bold">
              {currentKwh.toLocaleString()}
              <span className="text-text-muted ml-1 text-sm font-normal">
                kWh
              </span>
            </p>
          </div>
          <div className="bg-background rounded-lg p-3">
            <p className="text-text-muted text-xs">今月の電気代</p>
            <p className="font-heading text-text mt-1 text-xl font-bold">
              ¥{currentAmount.toLocaleString()}
            </p>
          </div>
          <a
            href="/electricity"
            className="border-primary text-primary hover:bg-primary-light col-span-1 flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            電気使用量を見る
            <ChevronRightIcon className="h-4 w-4" />
          </a>
          <a
            href="/billing"
            className="border-primary text-primary hover:bg-primary-light col-span-1 flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            電気代を見る
            <ChevronRightIcon className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-text-muted text-xs">今月</p>
            <p className="font-heading text-text text-lg font-bold">
              {currentKwh.toLocaleString()}
              <span className="text-text-muted ml-0.5 text-xs font-normal">
                kWh
              </span>
            </p>
            <p className="font-heading text-text-muted text-sm font-semibold">
              ¥{currentAmount.toLocaleString()}
            </p>
          </div>
          <a
            href={`/electricity?contractId=${contract.id}`}
            className="text-primary hover:text-primary-hover flex items-center gap-1 text-sm font-medium transition-colors"
          >
            詳細
            <ChevronRightIcon className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
