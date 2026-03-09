import type { BillStatus } from "../../types";

interface BadgeProps {
  status: BillStatus;
}

const STATUS_CONFIG: Record<BillStatus, { label: string; className: string }> =
  {
    unpaid: { label: "未払い", className: "bg-danger-light text-danger" },
    paid: { label: "支払済", className: "bg-success-light text-success" },
    overdue: { label: "期限超過", className: "bg-danger-light text-danger" },
    processing: { label: "処理中", className: "bg-border text-text-muted" },
  };

export default function Badge({ status }: BadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
