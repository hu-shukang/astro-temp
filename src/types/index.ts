// ─── Enums / Union Types ─────────────────────────────────────────

export type ContractStatus =
  | "active"
  | "pending"
  | "terminated"
  | "transferring";

export type BillStatus = "unpaid" | "paid" | "overdue" | "processing";

export type NotificationType =
  | "bill_issued"
  | "bill_due"
  | "usage_alert"
  | "contract_update"
  | "points_expiring"
  | "campaign"
  | "system"
  | "contact_replied";

export type PaymentMethodType =
  | "credit_card"
  | "bank_transfer"
  | "convenience_store";

export type PointHistoryType = "earned" | "used" | "expired" | "exchanged";

export type InquiryStatus = "open" | "answered";

export type InquiryCategory =
  | "billing"
  | "contract"
  | "usage"
  | "points"
  | "web"
  | "other";

export type FaqCategory =
  | "billing"
  | "usage"
  | "contract"
  | "payment"
  | "move_terminate"
  | "points"
  | "account";

// ─── User ────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO 8601
}

// ─── Contract ────────────────────────────────────────────────────

export interface Contract {
  id: string;
  userId: string;
  address: string;
  planName: string;
  ampere: number;
  status: ContractStatus;
  startDate: string;
  endDate?: string;
  paymentMethodId: string;
}

// ─── UsageRecord ─────────────────────────────────────────────────

export interface MonthlyUsage {
  contractId: string;
  year: number;
  month: number; // 1-12
  kwh: number;
  forecastKwh?: number;
  forecastAmount?: number;
}

export interface DailyUsage {
  contractId: string;
  year: number;
  month: number;
  day: number;
  kwh: number;
}

// ─── Bill ────────────────────────────────────────────────────────

export interface Bill {
  id: string;
  contractId: string;
  year: number;
  month: number;
  totalAmount: number;
  baseCharge: number;
  usageCharge: number;
  fuelAdjustment: number;
  kwh: number;
  status: BillStatus;
  dueDate: string;
  paidAt?: string;
}

// ─── Notification ────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
  relatedUrl?: string;
  createdAt: string;
}

// ─── PointHistory ────────────────────────────────────────────────

export interface PointHistory {
  id: string;
  userId: string;
  type: PointHistoryType;
  amount: number;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

// ─── PaymentMethod ───────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  cardBrand?: "visa" | "mastercard" | "jcb" | "amex";
  cardLast4?: string;
  cardExpiry?: string;
  cardHolder?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  isDefault: boolean;
}

// ─── Inquiry ─────────────────────────────────────────────────────

export interface Inquiry {
  id: string;
  userId: string;
  category: InquiryCategory;
  subject: string;
  body: string;
  status: InquiryStatus;
  referenceNumber: string;
  createdAt: string;
  answeredAt?: string;
}

// ─── FAQ ─────────────────────────────────────────────────────────

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}
