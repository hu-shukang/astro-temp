# 調査・発見事項

## プロジェクト現状

### 技術スタック（確認済み）

- Astro 5 + React 19 + Tailwind CSS v4
- TypeScript 厳格モード（`astro/tsconfigs/strict`）
- ESLint + Prettier（astro、tailwind、organize-imports プラグイン）
- Vitest + V8 カバレッジ
- ファイルベースルーティング：`src/pages/`

### 既存ファイル

| ファイル                       | 内容                                           |
| ------------------------------ | ---------------------------------------------- |
| `src/layouts/Layout.astro`     | 基本 HTML シェル（title prop なし、lang="en"） |
| `src/pages/index.astro`        | テンプレート歓迎ページ（要置換）               |
| `src/components/Welcome.astro` | テンプレートコンポーネント（削除予定）         |
| `src/styles/global.css`        | `@import "tailwindcss"` のみ                   |

### インストール済み依存パッケージ

**本番依存:**

- `astro@^5.17.1`
- `@astrojs/react@^4.4.2`
- `react@^19.2.4`、`react-dom@^19.2.4`

**開発依存:**

- `tailwindcss@^4.2.1`（`@tailwindcss/vite` 経由）
- `eslint@^9`、`prettier@3.8.1`
- `vitest@^4.0.18`

### 追加予定パッケージ

| パッケージ        | 用途                                  |
| ----------------- | ------------------------------------- |
| `recharts`        | React ネイティブグラフ、React 19 互換 |
| `react-hook-form` | フォームバリデーション                |
| `date-fns`        | 軽量日付フォーマット                  |
| `clsx`            | 条件付き Tailwind クラス結合          |
| `zustand`         | ユーザー認証状態のグローバル管理      |

---

## 重要な実装メモ

### Astro Islands パターン

- React インタラクティブコンポーネントには必ず `client:load` 指定
- グラフ、フォーム、ナビゲーションは全て `client:load`
- 静的な表示のみのものは `.astro` コンポーネントで可

### Zustand 認証ストア設計

```typescript
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}
// localStorage への永続化: zustand/middleware の persist を使用
```

### モック認証の仕組み

- ユーザーデータは `mockData.ts` に定義
- `zustand` の `persist` ミドルウェアで `localStorage` に保存
- ログインページ以外は `AuthGuard.tsx` でログイン確認

### マルチステップフォームの設計

```typescript
// MultiStepForm.tsx の状態管理
const [currentStep, setCurrentStep] = useState(0);
const [formData, setFormData] = useState({});
// 各ステップは react-hook-form を使用
// 全ステップのデータは親コンポーネントで集約
```

### 前年同月比カード（YoYCard）

```typescript
interface YoYCardProps {
  label: string; // "1月"
  current: number; // 当年値
  previous: number; // 前年値
  unit: string; // "kWh" | "¥"
}
// 増減率 = (current - previous) / previous * 100
// 増加: 赤 ↑、減少: 緑 ↓（電力使用量の場合）
// 請求金額の場合: 増加: 赤 ↑、減少: 緑 ↓
```

### モックデータ規模

- 月別使用量：過去 24 ヶ月（2024-01 〜 2025-12）
- 前年データ：2023-01 〜 2023-12（比較用）
- 日別使用量：各月 28〜31 日分
- 請求書：過去 12 ヶ月
- モックユーザー：1 件（テスト用）
- 通知：20 件程度（各タイプ混在、既読/未読混在）
- ポイント明細：過去 12 ヶ月分（獲得・使用履歴）

---

### 通知機能の実装メモ

```typescript
// notificationStore.ts
interface Notification {
  id: string;
  type:
    | "bill_issued"
    | "payment_due"
    | "usage_alert"
    | "power_outage"
    | "system_maintenance";
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number; // notifications.filter(n => !n.isRead).length
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  // 削除機能なし
}
```

- 未読件数はナビバーの `NotificationBell` にバッジ表示
- 通知一覧ページでタブ切替（全て / 未読のみ）

### ポイント機能の実装メモ

```typescript
// pointsStore.ts
interface PointTransaction {
  id: string;
  type: "earned" | "redeemed";
  points: number; // 正: 獲得、負: 使用
  reason: string; // "期日通り支払い" | "節電達成" | "電気代充当"
  relatedMonth?: string; // "2026-01"（関連する請求月）
  createdAt: string;
}

interface PointsState {
  balance: number;
  transactions: PointTransaction[];
  redeem: (points: number) => void; // 充当処理（balance 減少 + transaction 追加）
}
```

- ポイント換算レート：100pt = ¥1
- 充当可能最小単位：100pt
- `RedeemModal` で充当ポイント数を入力 → 確認 → 実行

---

## 未解決事項

- [ ] Tailwind v4 での CSS カスタムプロパティ定義方法の確認
- [ ] recharts `ResponsiveContainer` のクライアントサイドレンダリング時の挙動確認
