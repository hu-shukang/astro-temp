import { useEffect, useState } from "react";
import { useContractStore } from "../../store/contractStore";
import { ContractSelector } from "../ui/ContractSelector";
import { DailyView } from "./DailyView";
import { MonthlyView } from "./MonthlyView";

type ViewMode = "monthly" | "daily";

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
