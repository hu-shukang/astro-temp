# 電力会社ユーザーポータル - Technical Plan

## ステータス: 策定完了（実装前）

---

## 1. ディレクトリ構成

```
src/
├── styles/
│   └── global.css                          # @theme {} カスタムプロパティ + Google Fonts
│
├── layouts/
│   ├── Layout.astro                        # HTML基盤（head, meta, title slot）
│   ├── AppLayout.astro                     # TopNav付きアプリレイアウト
│   └── AuthLayout.astro                    # 認証ページ用レイアウト（TopNavなし・中央揃え）
│
├── pages/
│   ├── index.astro                         # ホーム (/)
│   ├── electricity/
│   │   └── index.astro                     # 電気使用量 (/electricity?view=monthly|daily)
│   ├── billing/
│   │   └── index.astro                     # 電気代 (/billing)
│   ├── notifications/
│   │   └── index.astro                     # お知らせ (/notifications)
│   ├── points/
│   │   └── index.astro                     # ポイント (/points)
│   ├── auth/
│   │   ├── login.astro                     # ログイン (/auth/login)
│   │   ├── register.astro                  # 新規登録 (/auth/register)
│   │   └── forgot-password.astro           # パスワードリセット (/auth/forgot-password)
│   ├── account/
│   │   ├── profile.astro                   # プロフィール (/account/profile)
│   │   ├── payment.astro                   # 支払い方法 (/account/payment)
│   │   └── withdraw.astro                  # 退会 (/account/withdraw)
│   ├── service/
│   │   ├── apply.astro                     # 新規申請 (/service/apply)
│   │   ├── terminate.astro                 # 解約申請 (/service/terminate)
│   │   ├── change-plan.astro               # プラン変更 (/service/change-plan)
│   │   ├── transfer.astro                  # 他社切替 (/service/transfer)
│   │   └── move.astro                      # 引越し申請 (/service/move)
│   └── support/
│       ├── faq.astro                       # FAQ (/support/faq)
│       └── contact/
│           ├── index.astro                 # お問い合わせ (/support/contact)
│           └── history.astro               # お問い合わせ履歴 (/support/contact/history)
│
├── components/
│   ├── layout/
│   │   └── TopNav.tsx                      # 固定TopNav（ドロップダウン・通知バッジ・ユーザーメニュー）
│   │
│   ├── ui/
│   │   ├── Icons.tsx                       # インラインSVGアイコンコンポーネント群
│   │   ├── StatCard.tsx                    # 数値・単位・前月比バッジカード
│   │   ├── YoYCard.tsx                     # 前年同月比カード
│   │   ├── ContractSelector.tsx            # 契約切り替えドロップダウン
│   │   ├── LoadingSpinner.tsx              # スピナー
│   │   ├── SkeletonCard.tsx                # ローディングスケルトン
│   │   ├── Toast.tsx                       # Toastメッセージ（右上・3秒）
│   │   ├── Modal.tsx                       # 汎用モーダル基盤
│   │   └── Badge.tsx                       # ステータスバッジ（unpaid/paid/overdue/processing）
│   │
│   ├── dashboard/
│   │   ├── Dashboard.tsx                   # ホームページ全体（パターンA/B切替）
│   │   ├── ContractSummaryCard.tsx         # 契約サマリーカード（ホーム用）
│   │   ├── NotificationSnippet.tsx         # お知らせ最新3件プレビュー
│   │   └── PointsSnippet.tsx               # ポイント残高・クイックリンク
│   │
│   ├── electricity/
│   │   ├── ElectricityView.tsx             # 電気使用量ページ全体（Segmented Controls）
│   │   ├── MonthlyChart.tsx                # 月別グラフ（ComposedChart）
│   │   ├── DailyChart.tsx                  # 日別グラフ（ComposedChart + 月ナビ）
│   │   ├── UsageForecast.tsx               # 月末予測表示
│   │   └── ChartTooltip.tsx                # カスタムTooltip（差分表示付き）
│   │
│   ├── billing/
│   │   ├── BillingView.tsx                 # 電気代ページ全体
│   │   ├── BillingChart.tsx                # 月別電気代グラフ（ComposedChart）
│   │   ├── BillCard.tsx                    # 請求書一覧アイテム
│   │   └── BillDetailModal.tsx             # 請求書詳細モーダル
│   │
│   ├── notifications/
│   │   ├── NotificationsView.tsx           # お知らせページ全体
│   │   └── NotificationItem.tsx            # お知らせ1件（アコーディオン展開）
│   │
│   ├── points/
│   │   ├── PointsView.tsx                  # ポイントページ全体
│   │   ├── PointHistoryItem.tsx            # ポイント履歴1件
│   │   └── RedeemModal.tsx                 # ポイント充当モーダル
│   │
│   ├── forms/
│   │   ├── StepForm.tsx                    # マルチステップフォーム共通ラッパー
│   │   ├── StepIndicator.tsx               # ステップ進捗表示（●────○）
│   │   ├── ApplyForm.tsx                   # 新規申請フォーム（4ステップ）
│   │   ├── TerminateForm.tsx               # 解約申請フォーム（3ステップ）
│   │   ├── ChangePlanForm.tsx              # プラン変更フォーム（3ステップ）
│   │   ├── TransferForm.tsx                # 他社切替フォーム（4ステップ）
│   │   └── MoveForm.tsx                    # 引越し申請フォーム（3ステップ）
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx                   # ログインフォーム
│   │   ├── RegisterForm.tsx                # 新規登録フォーム
│   │   └── ForgotPasswordForm.tsx          # パスワードリセットフォーム
│   │
│   ├── account/
│   │   ├── ProfileView.tsx                 # プロフィールページ
│   │   ├── PaymentView.tsx                 # 支払い方法ページ
│   │   └── WithdrawView.tsx                # 退会ページ
│   │
│   └── support/
│       ├── FaqView.tsx                     # FAQページ（検索・カテゴリ・アコーディオン）
│       ├── ContactForm.tsx                 # お問い合わせフォーム
│       └── ContactHistoryView.tsx          # お問い合わせ履歴
│
├── store/
│   ├── authStore.ts                        # 認証ストア
│   ├── contractStore.ts                    # 契約ストア
│   ├── notificationStore.ts                # お知らせストア
│   ├── pointStore.ts                       # ポイントストア
│   ├── uiStore.ts                          # UI状態ストア（モバイルメニュー等）
│   └── mockData.ts                         # 全モックデータ
│
└── types/
    └── index.ts                            # 全エンティティ型定義
```

---

## 2. データ型定義（TypeScript）

### src/types/index.ts

```typescript
// ─── Enums / Union Types ────────────────────────────────────────

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

// ─── User ───────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO 8601
}

// ─── Contract ───────────────────────────────────────────────────

export interface Contract {
  id: string;
  userId: string;
  address: string; // 供給住所（都道府県＋市区町村＋番地）
  planName: string; // プラン名（例: スタンダードプラン）
  ampere: number; // アンペア数（例: 30）
  status: ContractStatus;
  startDate: string; // ISO 8601
  endDate?: string; // 解約済みの場合
  paymentMethodId: string; // 紐付く支払い方法ID
}

// ─── UsageRecord ────────────────────────────────────────────────

export interface MonthlyUsage {
  contractId: string;
  year: number;
  month: number; // 1-12
  kwh: number;
  forecastKwh?: number; // 当月の月末予測（当月のみ）
  forecastAmount?: number; // 当月の月末予測電気代（当月のみ）
}

export interface DailyUsage {
  contractId: string;
  year: number;
  month: number;
  day: number;
  kwh: number;
}

// ─── Bill ───────────────────────────────────────────────────────

export interface Bill {
  id: string;
  contractId: string;
  year: number;
  month: number;
  totalAmount: number; // 合計金額（円）
  baseCharge: number; // 基本料金
  usageCharge: number; // 電力量料金
  fuelAdjustment: number; // 燃料費調整額
  kwh: number; // 使用量
  status: BillStatus;
  dueDate: string; // ISO 8601（支払期限）
  paidAt?: string; // 支払完了日時
}

// ─── Notification ───────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string; // 表示タイトル（固定）
  body: string; // 個別本文
  isRead: boolean;
  relatedId?: string; // 関連データID（billId等）
  relatedUrl?: string; // 関連ページURL
  createdAt: string; // ISO 8601
}

// ─── PointHistory ───────────────────────────────────────────────

export interface PointHistory {
  id: string;
  userId: string;
  type: PointHistoryType;
  amount: number; // 正: 獲得 / 負: 使用・失効
  description: string; // 例: 契約継続ボーナス / 電気代充当
  expiresAt?: string; // ポイント失効日（獲得時のみ）
  createdAt: string; // ISO 8601
}

// ─── PaymentMethod ──────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  // クレジットカード用
  cardBrand?: "visa" | "mastercard" | "jcb" | "amex";
  cardLast4?: string;
  cardExpiry?: string; // 'MM/YY'
  cardHolder?: string;
  // 口座振替用
  bankName?: string;
  accountNumber?: string; // マスク済み
  accountHolder?: string;
  isDefault: boolean;
}

// ─── Inquiry ────────────────────────────────────────────────────

export interface Inquiry {
  id: string;
  userId: string;
  category: InquiryCategory;
  subject: string;
  body: string;
  status: InquiryStatus;
  referenceNumber: string; // 受付番号（例: #20250309-001）
  createdAt: string;
  answeredAt?: string;
}

// ─── FAQ ────────────────────────────────────────────────────────

export type FaqCategory =
  | "billing"
  | "usage"
  | "contract"
  | "payment"
  | "move_terminate"
  | "points"
  | "account";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}
```

---

## 3. Zustandストア設計

ストアは機能ドメインごとに分割し、各ファイルを `src/store/` に配置する。

### authStore.ts

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}
```

- `login(user)`: user をセット、isAuthenticated = true
- `logout()`: user = null、isAuthenticated = false
- 初期値: mockData の user をセット（認証不要で全ページ閲覧可能にする）

### contractStore.ts

```typescript
interface ContractState {
  contracts: Contract[];
  selectedContractId: string | null;
  isLoading: boolean;
  setSelectedContract: (id: string) => void;
  setLoading: (loading: boolean) => void;
}
```

- `setSelectedContract(id)`: selectedContractId を更新 + isLoading = true → 200ms後に isLoading = false（モック遅延）
- 初期値: mockData の contracts、selectedContractId = contracts[0].id

### notificationStore.ts

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}
```

- `markAsRead(id)`: 該当通知の isRead = true、unreadCount を再計算
- `markAllAsRead()`: 全通知の isRead = true、unreadCount = 0
- unreadCount は `notifications.filter(n => !n.isRead).length` から derived

### pointStore.ts

```typescript
interface PointState {
  balance: number;
  history: PointHistory[];
  expiringPoints: number; // 直近失効予定ポイント
  expiringDate: string | null; // 失効日
  redeemForBill: (points: number) => void;
}
```

- `redeemForBill(points)`: balance から減算、history に追加

### uiStore.ts

```typescript
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface UiState {
  isMobileMenuOpen: boolean;
  activeDropdown: string | null; // 'electricity' | 'service' | 'support' | 'user' | null
  toggleMobileMenu: () => void;
  setActiveDropdown: (key: string | null) => void;
  toasts: Toast[];
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}
```

---

## 4. モックデータ設計（src/store/mockData.ts）

### ユーザー

```
id: 'user-001'
name: '田中太郎'
email: 'tanaka@example.com'
createdAt: '2022-04-01T00:00:00Z'
```

### 契約（2件）

```
Contract A:
  id: 'contract-001'
  address: '東京都渋谷区神南1-1-1'
  planName: 'スタンダードプラン'
  ampere: 30
  status: 'active'
  startDate: '2022-04-01'
  paymentMethodId: 'pm-001'

Contract B:
  id: 'contract-002'
  address: '神奈川県横浜市中区山下町1-1'
  planName: 'エコプラン'
  ampere: 20
  status: 'active'
  startDate: '2023-01-15'
  paymentMethodId: 'pm-002'
```

### 月別使用量（各契約24ヶ月分: 2024年3月〜2026年3月）

生成ルール:

- 夏（7-8月）: 350〜420 kWh（冷房需要）
- 冬（12-1月）: 330〜400 kWh（暖房需要）
- 春秋: 200〜280 kWh
- 前年比: ランダムに ±10% 程度のばらつき
- 2026年3月（当月）: 部分データ → forecastKwh, forecastAmount あり

### 日別使用量（各契約: 直近3ヶ月分）

- 1日あたり 8〜15 kWh のランダム値
- 2026年3月: 9日分まで（本日 2026-03-09 まで）

### 請求書（各契約12ヶ月分）

- 2026年3月分: `unpaid`（dueDate: 2026-04-30）
- 2026年2月分: `paid`
- 2025年3月〜2026年1月分: `paid`
- 金額計算式: `基本料金(ampere × 55円) + 電力量料金(kwh × 22円) + 燃料費調整額(kwh × 1.15円)`

### 通知（8件）

各 `NotificationType` から1件ずつ。未読は bill_issued, usage_alert, points_expiring の3件。

### ポイント履歴（12件）

- 毎月 +200P（契約継続ボーナス）: 2025年4月〜2026年3月
- 2025年10月: -500P（電気代充当）
- 残高: 2,400P
- 失効予定: 1,200P（2026年4月30日）

### 支払い方法

```
pm-001: クレジットカード VISA *1234 有効期限 12/26 田中 タロウ isDefault: true
pm-002: 口座振替 横浜銀行 ****5678 タナカ タロウ isDefault: false
```

### FAQ（各カテゴリ3問、計21問）

### お問い合わせ（2件）

- 1件: `answered`（過去）
- 1件: `open`（最近）

---

## 5. コンポーネント設計（Props型定義）

### TopNav.tsx

```typescript
// props なし（全データはストアから取得）
interface DropdownItem {
  label: string;
  href: string;
  dividerBefore?: boolean;
}

interface NavItem {
  label: string;
  href?: string;
  dropdownKey?: string;
  items?: DropdownItem[];
}
```

実装ポイント:

- `position: fixed; top: 0; z-index: 50; height: 56px`
- ドロップダウンは click で toggle（ホバーはモバイル非対応のため click 統一）
- ドロップダウン外クリックで閉じる（`useEffect` + `document.addEventListener`）
- `activeDropdown` が一致するキーのパネルのみ表示
- 現在のパス（`window.location.pathname`）でアクティブ判定: `text-primary border-b-2 border-primary`

### ContractSelector.tsx

```typescript
interface ContractSelectorProps {
  className?: string;
}
// 内部で contractStore から contracts, selectedContractId, setSelectedContract, isLoading を取得
```

- 選択変更 → `setSelectedContract(id)` 呼び出し → isLoading が true の間スピナー表示
- 「+ 新規契約を申し込む」: `/service/apply` へ遷移

### StatCard.tsx

```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  changePercent?: number; // 前月比（正: 増加, 負: 減少）
  changeLabel?: string; // 例: '前月比'
  isLoading?: boolean;
}
```

- changePercent > 0: 赤矢印「↑」（増加 = 悪い）
- changePercent < 0: 緑矢印「↓」（減少 = 良い）
- isLoading: SkeletonCard 表示

### YoYCard.tsx

```typescript
interface YoYCardProps {
  currentYear: number;
  currentValue: number;
  previousValue: number;
  unit: string; // 'kWh' | '円'
}
// changePercent は内部計算: ((current - previous) / previous) * 100
```

### MonthlyChart.tsx / BillingChart.tsx（ComposedChart共通）

```typescript
interface ChartDataPoint {
  label: string; // 月ラベル（例: '3月'）
  currentValue: number; // 今年の値
  previousValue?: number; // 前年の値（折線）
}

interface MonthlyChartProps {
  data: ChartDataPoint[];
  unit: string; // 'kWh' | '円'
  barColor?: string; // デフォルト: '#2563EB'
  lineColor?: string; // デフォルト: '#F97316'
  isLoading?: boolean;
}
```

- `<ComposedChart>` + `<Bar dataKey="currentValue">` + `<Line dataKey="previousValue">`
- カスタム `<Tooltip content={<ChartTooltip unit={unit} />}>` で差分・パーセント表示

### ChartTooltip.tsx

```typescript
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit: string;
}
```

### BillCard.tsx

```typescript
interface BillCardProps {
  bill: Bill;
  onDetailClick: (bill: Bill) => void;
}
```

### Badge.tsx

```typescript
interface BadgeProps {
  status: BillStatus;
}
// status → label/color マッピング:
// unpaid      → '未払い'   / bg-danger
// paid        → '支払済'   / bg-success
// overdue     → '期限超過' / bg-danger
// processing  → '処理中'   / bg-muted
```

### NotificationItem.tsx

```typescript
interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}
```

- isRead: false → 左に青丸アイコン、true → グレー
- クリック → `onRead(id)` + アコーディオン展開
- `relatedUrl` があれば「詳細を見る →」リンク表示

### StepForm.tsx（マルチステップフォーム共通ラッパー）

```typescript
interface StepConfig {
  title: string;
  component: React.ComponentType<StepProps>;
}

interface StepProps {
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
  formData: Record<string, unknown>;
  isLast?: boolean;
}

interface StepFormProps {
  steps: StepConfig[];
  onComplete: (allData: Record<string, unknown>) => void;
  formTitle: string;
}
```

- 内部 state: `currentStep: number`, `formData: Record<string, unknown>`
- `onNext(data)`: formData をマージ、currentStep++
- 最終ステップ完了後: 受付番号生成（`#YYYYMMDD-NNN`）+ 完了画面表示

### Modal.tsx

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}
```

- Portal で `document.body` 直下に描画
- `scale 0.95→1 + opacity` アニメーション 200ms
- ESC キーで閉じる
- `prefers-reduced-motion` 考慮

---

## 6. ページ別実装詳細

### ホーム (`/`)

**React コンポーネント**: `<Dashboard client:load />`

```
contractStore.contracts.length >= 2
  → パターンA: 全契約合計StatCard×2 + ContractSummaryCardグリッド
  → パターンB: 単一契約StatCard×2 + 横幅フル ContractSummaryCard
+ 下部: NotificationSnippet + PointsSnippet（常に表示）
```

### 電気使用量 (`/electricity`)

**React コンポーネント**: `<ElectricityView client:load />`

1. `useEffect` で `window.location.search` を読み、初期 `activeView` を設定
2. Segmented Controls 切り替え → `history.replaceState` で URL を更新（ページ遷移なし）
3. `contractStore.selectedContractId` が変わったらデータを再取得

**月別表示時**: MonthlyChart（過去12ヶ月）+ UsageForecast + YoYCard
**日別表示時**: 月ナビゲーション + DailyChart（翌月 > 今月の場合は disabled）

### 電気代 (`/billing`)

1. ContractSelector でアクティブ契約選択
2. BillingChart: 月別請求金額12ヶ月分
3. BillCard 一覧: 新しい月順にソート
4. 「詳細」クリック → BillDetailModal 表示

### お知らせ (`/notifications`)

1. `notifications` を `createdAt` 降順で表示
2. 「一括既読にする」→ `markAllAsRead()`
3. 各アイテムクリック → `markAsRead(id)` + アコーディオン展開

### 認証ページ群

- `AuthLayout` を使用（TopNavなし）
- `react-hook-form` でバリデーション実装
- 送信後: モックで成功を返し `/` へ遷移

### サービス申請フォーム群

全フォームは `StepForm.tsx` を使用。

| ページ     | ステップ数 | ステップ内容                                      |
| ---------- | ---------- | ------------------------------------------------- |
| 新規申請   | 4          | 供給住所 → プラン選択 → 支払い方法 → 確認         |
| 解約申請   | 3          | 対象契約選択 → 解約日・理由 → 確認                |
| プラン変更 | 3          | 現在のプラン確認 → 新プラン選択 → 確認            |
| 他社切替   | 4          | 現在の電力会社情報 → 供給住所 → プラン選択 → 確認 |
| 引越し申請 | 3          | 現契約確認 → 新住所・引越し日 → 確認              |

### 支払い方法 (`/account/payment`)

1. ContractSelector でアクティブ契約選択
2. 現在の支払い方法を表示
3. ラジオボタンで変更選択 → 選択種別に応じてフォームフィールド表示
4. 「変更する」送信 → Toast「翌月請求分から反映されます」

### FAQ (`/support/faq`)

1. カテゴリフィルター: local state `selectedCategory`
2. キーワード検索: `question + answer` の includes で絞り込み
3. アコーディオン形式で回答表示
4. 絞り込み後0件: Empty state + お問い合わせリンク

---

## 7. デザインシステム（global.css）

```css
@import url("https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap");

@import "tailwindcss";

@theme {
  /* カラーパレット */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-secondary: #3b82f6;
  --color-cta: #f97316;
  --color-cta-hover: #ea6c00;

  --color-background: #f8fafc;
  --color-surface: #ffffff;

  --color-text: #1e293b;
  --color-muted: #475569;
  --color-border: #e2e8f0;

  --color-success: #10b981;
  --color-success-light: #d1fae5;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-danger: #ef4444;
  --color-danger-light: #fee2e2;

  /* フォント */
  --font-heading: "Fira Code", monospace;
  --font-body: "Fira Sans", sans-serif;

  /* TopNav高さ */
  --topnav-height: 56px;
}

html {
  background-color: var(--color-background);
  font-family: var(--font-body);
  color: var(--color-text);
}

.app-content {
  padding-top: var(--topnav-height);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Tailwind v4 の `@theme {}` ブロックでカスタムプロパティを定義することで、`text-primary`・`bg-surface`・`border-border` 等の Tailwind ユーティリティクラスとして使用可能になる。

---

## 8. 実装順序（フェーズ分け）

### Phase 1: 基盤構築

1. `global.css` — `@theme {}` カスタムプロパティ、Google Fonts
2. `src/types/index.ts` — 全型定義
3. `src/store/mockData.ts` — 全モックデータ
4. `src/store/authStore.ts`
5. `src/store/contractStore.ts`
6. `src/store/notificationStore.ts`
7. `src/store/pointStore.ts`
8. `src/store/uiStore.ts`
9. `src/layouts/Layout.astro` — 基盤HTML
10. `src/layouts/AppLayout.astro` — TopNav + スロット
11. `src/layouts/AuthLayout.astro`
12. `src/components/layout/TopNav.tsx`
13. `src/components/ui/Icons.tsx`
14. `src/components/ui/` — Badge, Modal, Toast, LoadingSpinner, SkeletonCard

### Phase 2: 高優先度ページ

1. `StatCard.tsx`, `YoYCard.tsx`, `ContractSelector.tsx`
2. `Dashboard.tsx` + `ContractSummaryCard.tsx` + `NotificationSnippet.tsx` + `PointsSnippet.tsx`
3. `pages/index.astro`（ホーム）
4. `ChartTooltip.tsx`, `MonthlyChart.tsx`, `DailyChart.tsx`, `UsageForecast.tsx`
5. `ElectricityView.tsx` + `pages/electricity/index.astro`
6. `BillingChart.tsx`, `BillCard.tsx`, `BillDetailModal.tsx`, `BillingView.tsx` + `pages/billing/index.astro`
7. `NotificationItem.tsx`, `NotificationsView.tsx` + `pages/notifications/index.astro`
8. `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx` + 認証ページ群
9. `ProfileView.tsx` + `pages/account/profile.astro`
10. `PaymentView.tsx` + `pages/account/payment.astro`
11. `StepIndicator.tsx`, `StepForm.tsx`
12. `ApplyForm.tsx` + `pages/service/apply.astro`
13. `TerminateForm.tsx` + `pages/service/terminate.astro`

### Phase 3: 中優先度ページ

1. `PointHistoryItem.tsx`, `RedeemModal.tsx`, `PointsView.tsx` + `pages/points/index.astro`
2. `ChangePlanForm.tsx` + `pages/service/change-plan.astro`
3. `TransferForm.tsx` + `pages/service/transfer.astro`
4. `MoveForm.tsx` + `pages/service/move.astro`
5. `WithdrawView.tsx` + `pages/account/withdraw.astro`
6. `FaqView.tsx` + `pages/support/faq.astro`
7. `ContactForm.tsx` + `pages/support/contact/index.astro`
8. `ContactHistoryView.tsx` + `pages/support/contact/history.astro`

---

## 9. 技術的注意事項

### Astro + React のインタラクティブ化

全 React コンポーネントは `client:load` ディレクティブで hydrate する。Zustand ストアへのアクセスは React コンポーネント内のみ。Astro ファイルはレイアウトとページラッパーのみ担当する。

### URL クエリパラメータ管理（電気使用量ページ）

Astro は SSG のため、サーバーサイドでクエリパラメータは読めない。`client:load` した React コンポーネント内で `window.location.search` を読み取り、`history.replaceState` で更新する。

### ドロップダウンの外クリック閉じ

`uiStore.activeDropdown` で管理し、`document.addEventListener('mousedown', handler)` で外クリックを検知。`useEffect` のクリーンアップで必ずリスナーを除去する。

### Recharts の SSR 問題

Recharts は `window` オブジェクトを参照するため、必ず `client:load` が付いた React コンポーネント内で使用する。Astro のビルド時（SSG）には描画しない。

### clsx の使用方針

条件付きクラス名の結合は必ず `clsx` を使用する（template literal は使わない）。

### date-fns の日付操作

`format(date, 'yyyy年M月', { locale: ja })` 等、日本語ロケールを使用する。`ja` ロケールは `date-fns/locale/ja` からインポート。

### フォームのバリデーション

`react-hook-form` の `register` + `errors` を使用。エラーメッセージは入力欄直下に `text-danger text-sm` で表示。送信中は submit ボタンを `disabled` + スピナー表示。
