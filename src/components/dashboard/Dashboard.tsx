import { useMemo } from "react";
import { useContractStore } from "../../store/contractStore";
import { mockBills, mockMonthlyUsage } from "../../store/mockData";
import { StatCard } from "../ui/StatCard";
import { ContractSummaryCard } from "./ContractSummaryCard";
import { NotificationSnippet } from "./NotificationSnippet";
import { PointsSnippet } from "./PointsSnippet";

/** 指定契約・年月のkWhを返す（見つからない場合は0） */
function getKwh(contractId: string, year: number, month: number): number {
  const rec = mockMonthlyUsage.find(
    (u) => u.contractId === contractId && u.year === year && u.month === month,
  );
  return rec ? (rec.forecastKwh ?? rec.kwh) : 0;
}

/** 指定契約・年月の請求金額を返す */
function getAmount(contractId: string, year: number, month: number): number {
  const bill = mockBills.find(
    (b) => b.contractId === contractId && b.year === year && b.month === month,
  );
  return bill ? bill.totalAmount : 0;
}

export function Dashboard() {
  const contracts = useContractStore((s) => s.contracts);

  // 今月: 2026/3、先月: 2026/2
  const CY = 2026,
    CM = 3,
    PY = 2026,
    PM = 2;

  const stats = useMemo(() => {
    const totalKwhCurrent = contracts.reduce(
      (sum, c) => sum + getKwh(c.id, CY, CM),
      0,
    );
    const totalKwhPrev = contracts.reduce(
      (sum, c) => sum + getKwh(c.id, PY, PM),
      0,
    );
    const totalAmountCurrent = contracts.reduce(
      (sum, c) => sum + getAmount(c.id, CY, CM),
      0,
    );
    const totalAmountPrev = contracts.reduce(
      (sum, c) => sum + getAmount(c.id, PY, PM),
      0,
    );

    const kwhChange =
      totalKwhPrev > 0
        ? ((totalKwhCurrent - totalKwhPrev) / totalKwhPrev) * 100
        : 0;
    const amountChange =
      totalAmountPrev > 0
        ? ((totalAmountCurrent - totalAmountPrev) / totalAmountPrev) * 100
        : 0;

    return { totalKwhCurrent, totalAmountCurrent, kwhChange, amountChange };
  }, [contracts]);

  const isMultiple = contracts.length >= 2;

  return (
    <div className="space-y-6">
      {/* StatCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={isMultiple ? "今月の使用量（全契約合計）" : "今月の使用量"}
          value={stats.totalKwhCurrent}
          unit="kWh"
          changePercent={stats.kwhChange}
        />
        <StatCard
          label={isMultiple ? "今月の電気代（全契約合計）" : "今月の電気代"}
          value={`¥${stats.totalAmountCurrent.toLocaleString()}`}
          unit=""
          changePercent={stats.amountChange}
        />
      </div>

      {/* Contract Section */}
      <section>
        <h2 className="text-text mb-3 text-base font-semibold">
          {isMultiple ? "契約一覧" : "ご契約内容"}
        </h2>
        {isMultiple ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contracts.map((c) => (
              <ContractSummaryCard
                key={c.id}
                contract={c}
                currentKwh={getKwh(c.id, CY, CM)}
                currentAmount={getAmount(c.id, CY, CM)}
              />
            ))}
          </div>
        ) : (
          <ContractSummaryCard
            contract={contracts[0]}
            currentKwh={getKwh(contracts[0].id, CY, CM)}
            currentAmount={getAmount(contracts[0].id, CY, CM)}
            expanded
          />
        )}
      </section>

      {/* Bottom Row: Notifications + Points */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotificationSnippet />
        <PointsSnippet />
      </div>
    </div>
  );
}
