import { useEffect, useRef, useState } from "react";
import { useContractStore } from "../../store/contractStore";
import { ChevronDownIcon } from "./Icons";

export function ContractSelector() {
  const contracts = useContractStore((s) => s.contracts);
  const selectedId = useContractStore((s) => s.selectedContractId);
  const setSelected = useContractStore((s) => s.setSelectedContract);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = contracts.find((c) => c.id === selectedId) ?? contracts[0];

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-border bg-surface text-text hover:border-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="max-w-[200px] truncate">
          {selected ? selected.address : "契約を選択"}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="border-border bg-surface absolute left-0 z-20 mt-1 min-w-[280px] rounded-lg border shadow-md"
          role="listbox"
        >
          {contracts.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={c.id === selectedId}
              onClick={() => {
                setSelected(c.id);
                setOpen(false);
              }}
              className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-blue-50 ${
                c.id === selectedId ? "bg-primary-light" : ""
              }`}
            >
              <span
                className={`font-medium ${c.id === selectedId ? "text-primary" : "text-text"}`}
              >
                {c.id === selectedId && "✓ "}
                {c.address}
              </span>
              <span className="text-text-muted text-xs">
                {c.planName} {c.ampere}A
              </span>
            </button>
          ))}

          <div className="border-border border-t">
            <a
              href="/service/apply"
              className="text-primary flex w-full items-center gap-1 rounded-b-lg px-4 py-3 text-sm font-medium hover:bg-blue-50"
            >
              <span>＋</span>
              <span>新規契約を申し込む</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
