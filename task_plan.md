# 電力会社 Web アプリケーション — タスク計画

## プロジェクト概要

電力会社向けのユーザー向け Web アプリを構築する。電力使用量の照会、請求書確認、各種申請手続き、アカウント管理を提供する。

## 技術スタック

| 項目           | 選択                        |
| -------------- | --------------------------- |
| フレームワーク | Astro 5 + React 19          |
| スタイリング   | Tailwind CSS v4             |
| チャート       | recharts                    |
| フォーム       | react-hook-form             |
| 状態管理       | Zustand（ユーザー認証状態） |
| 日付処理       | date-fns                    |
| ユーティリティ | clsx                        |
| 認証           | モック認証（localStorage）  |

## 決定事項

- **認証**: localStorage を使ったモック認証（実バックエンドなし）
- **申請フォーム**: マルチステップフォーム（単一ページ内で Step 切替）
- **年度比較**: 前年同月比カード（↑↓ パーセント表示）
- **状態管理**: Zustand（ユーザーログイン状態の管理）
- **レンダリング方式**: SSG + CSR（SSR は使用しない。全ページ静的生成、インタラクティブ部分は `client:load` で CSR）
- **言語**: 日本語（プランファイル・UI 両方）

---

## 機能一覧

### データ照会

- [ ] 月別電力使用量照会
- [ ] 日別電力使用量照会
- [ ] 電力使用量の前年同月比カード
- [ ] 月別請求書一覧・明細
- [ ] 請求金額の前年同月比カード

### 申請手続き（マルチステップフォーム）

- [ ] 電力使用申請（新規引込）
- [ ] 電力使用停止申請（廃止）
- [ ] 他社からの切替申請（転入）
- [ ] 引越し申請（使用場所変更）

### ユーザーアカウント

- [ ] ユーザー登録
- [ ] ユーザーログイン（モック）
- [ ] ユーザー情報変更

### お知らせ通知

- [ ] 通知一覧（既読/未読、削除不可）
- [ ] 通知タイプ: 請求書出票、支払期限、使用量超過アラート、停電通知、システムメンテナンス
- [ ] ナビバーに通知ベルアイコン + 未読件数バッジ

### ポイント機能

- [ ] ポイント残高表示
- [ ] ポイント獲得条件: 節電（前月比削減）、期日通り支払い
- [ ] ポイント使用: 電気代割引に充当
- [ ] ポイント明細（獲得・使用履歴）

---

## フェーズ計画

### フェーズ 1: 基盤構築

**状態**: 未着手

- 依存パッケージのインストール（recharts、react-hook-form、date-fns、clsx、zustand）
- `global.css`にデザイントークン（CSS カスタムプロパティ）を追加
- `src/data/mockData.ts` — モックデータ定義（使用量・請求書・ユーザー）
- `src/data/constants.ts` — 電気料金単価（ピーク/オフピーク/フラット）
- `src/lib/utils.ts` — 共通ユーティリティ関数
- `src/store/authStore.ts` — Zustand 認証ストア
- `Layout.astro`修正（title prop、lang="zh"）
- `AppLayout.astro`新規作成（サイドバー + ナビバー構成）

### フェーズ 2: UI 基盤コンポーネント

**状態**: 未着手

基本 UI コンポーネント:

- `Button.tsx`、`Card.tsx`、`Badge.tsx`、`StatCard.tsx`
- `Input.tsx`、`Select.tsx`、`Textarea.tsx`（フォーム部品）
- `StepIndicator.tsx`（マルチステップ進捗表示）
- `YoYCard.tsx`（前年同月比カード ↑↓）

レイアウトコンポーネント:

- `Navbar.tsx`（ログイン状態表示、モバイル対応）
- `Sidebar.tsx`（デスクトップ用サイドナビ）
- `AuthGuard.tsx`（未ログイン時リダイレクト）

### フェーズ 3: 認証ページ

**状態**: 未着手

- `src/pages/auth/login.astro` — ログインページ
- `src/pages/auth/register.astro` — 登録ページ
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- Zustand ストアによるログイン状態の永続化（localStorage）

### フェーズ 4: データ照会ページ

**状態**: 未着手

チャートコンポーネント:

- `MonthlyUsageChart.tsx` — 月別使用量（棒グラフ + 折線）
- `DailyUsageChart.tsx` — 日別使用量（棒グラフ）
- `UsageBreakdownChart.tsx` — ピーク/オフピーク/フラット円グラフ
- `YoYUsageSection.tsx` — 前年同月比カード一覧

請求書コンポーネント:

- `BillCard.tsx` — 請求書カード（展開式明細）
- `BillList.tsx` — 請求書一覧
- `YoYBillSection.tsx` — 前年請求額比較カード

ページ:

- `src/pages/index.astro` — ダッシュボード
- `src/pages/electricity/monthly.astro`
- `src/pages/electricity/daily.astro`
- `src/pages/billing.astro`

### フェーズ 5: 申請手続きページ

**状態**: 未着手

各申請フォームはマルチステップ形式（ステップ数は申請種別により異なる）:

| 申請種別         | ステップ構成                                      |
| ---------------- | ------------------------------------------------- |
| 申請用電（新規） | 個人情報 → 設置場所 → 使用計画 → 確認・送信       |
| 停止用電         | 個人確認 → 停止希望日 → 確認・送信                |
| 他社切替         | 個人情報 → 現在の契約情報 → 希望条件 → 確認・送信 |
| 引越し           | 個人確認 → 旧住所停止 → 新住所申請 → 確認・送信   |

- `src/pages/service/apply.astro` — 新規申請
- `src/pages/service/terminate.astro` — 停止申請
- `src/pages/service/transfer.astro` — 他社切替
- `src/pages/service/move.astro` — 引越し申請
- `src/components/service/MultiStepForm.tsx` — 共通マルチステップコンテナ
- 各種ステップコンポーネント

### フェーズ 6: アカウント管理ページ

**状態**: 未着手

- `src/pages/account/profile.astro` — ユーザー情報変更
- `src/components/account/ProfileForm.tsx`
- `src/components/account/PasswordForm.tsx`

### フェーズ 7: 通知機能

**状態**: 未着手

Zustand ストア:

- `src/store/notificationStore.ts` — 通知一覧・未読数管理（既読切替のみ、削除不可）

通知タイプ（モックデータで定義）:

| タイプ               | 説明                     |
| -------------------- | ------------------------ |
| `bill_issued`        | 請求書出票               |
| `payment_due`        | 支払期限リマインダー     |
| `usage_alert`        | 使用量超過アラート       |
| `power_outage`       | 停電通知                 |
| `system_maintenance` | システムメンテナンス通知 |

コンポーネント:

- `src/components/notifications/NotificationList.tsx` — 通知一覧（既読/未読フィルター）
- `src/components/notifications/NotificationItem.tsx` — 通知 1 件（タイプ別アイコン・色分け）
- `src/components/notifications/NotificationBell.tsx` — ナビバー用ベルアイコン + 未読バッジ

ページ:

- `src/pages/notifications.astro`

### フェーズ 8: ポイント機能

**状態**: 未着手

Zustand ストア:

- `src/store/pointsStore.ts` — ポイント残高・明細管理・充当処理

ポイントロジック（モック）:

- **獲得**: 節電（前月比 5% 以上削減 → 100pt）、期日通り支払い（毎月 50pt）
- **使用**: 電気代充当（100pt = ¥1 割引）
- **明細**: タイプ（`earned` / `redeemed`）、日時、獲得/使用 pt、理由

コンポーネント:

- `src/components/points/PointsSummary.tsx` — 残高カード + 充当ボタン
- `src/components/points/PointsHistory.tsx` — 明細テーブル（獲得/使用タブ切替）
- `src/components/points/RedeemModal.tsx` — 充当確認モーダル

ページ:

- `src/pages/points.astro`

---

## ページルーティング一覧

| ルート                 | ファイル                          | 認証必要 |
| ---------------------- | --------------------------------- | -------- |
| `/`                    | `pages/index.astro`               | ✅       |
| `/auth/login`          | `pages/auth/login.astro`          | ❌       |
| `/auth/register`       | `pages/auth/register.astro`       | ❌       |
| `/electricity/monthly` | `pages/electricity/monthly.astro` | ✅       |
| `/electricity/daily`   | `pages/electricity/daily.astro`   | ✅       |
| `/billing`             | `pages/billing.astro`             | ✅       |
| `/service/apply`       | `pages/service/apply.astro`       | ✅       |
| `/service/terminate`   | `pages/service/terminate.astro`   | ✅       |
| `/service/transfer`    | `pages/service/transfer.astro`    | ✅       |
| `/service/move`        | `pages/service/move.astro`        | ✅       |
| `/account/profile`     | `pages/account/profile.astro`     | ✅       |
| `/notifications`       | `pages/notifications.astro`       | ✅       |
| `/points`              | `pages/points.astro`              | ✅       |

---

## ディレクトリ構成（最終形）

```
src/
├── data/
│   ├── mockData.ts
│   └── constants.ts
├── store/
│   └── authStore.ts          # Zustand 認証ストア
├── lib/
│   └── utils.ts
├── styles/
│   └── global.css
├── layouts/
│   ├── Layout.astro
│   └── AppLayout.astro
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── StatCard.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── StepIndicator.tsx
│   │   └── YoYCard.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── AuthGuard.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── charts/
│   │   ├── MonthlyUsageChart.tsx
│   │   ├── DailyUsageChart.tsx
│   │   └── UsageBreakdownChart.tsx
│   ├── billing/
│   │   ├── BillCard.tsx
│   │   └── BillList.tsx
│   ├── dashboard/
│   │   ├── QuickStats.tsx
│   │   ├── RecentBills.tsx
│   │   ├── YoYUsageSection.tsx
│   │   └── YoYBillSection.tsx
│   ├── service/
│   │   ├── MultiStepForm.tsx
│   │   ├── steps/
│   │   │   ├── ApplySteps.tsx
│   │   │   ├── TerminateSteps.tsx
│   │   │   ├── TransferSteps.tsx
│   │   │   └── MoveSteps.tsx
│   │   └── FormSuccessMessage.tsx
│   ├── account/
│   │   ├── ProfileForm.tsx
│   │   └── PasswordForm.tsx
│   ├── notifications/
│   │   ├── NotificationList.tsx
│   │   ├── NotificationItem.tsx
│   │   └── NotificationBell.tsx
│   └── points/
│       ├── PointsSummary.tsx
│       ├── PointsHistory.tsx
│       └── RedeemModal.tsx
├── store/
│   ├── authStore.ts
│   ├── notificationStore.ts
│   └── pointsStore.ts
└── pages/
    ├── index.astro
    ├── auth/
    │   ├── login.astro
    │   └── register.astro
    ├── electricity/
    │   ├── monthly.astro
    │   └── daily.astro
    ├── billing.astro
    ├── service/
    │   ├── apply.astro
    │   ├── terminate.astro
    │   ├── transfer.astro
    │   └── move.astro
    ├── account/
    │   └── profile.astro
    ├── notifications.astro
    └── points.astro
```
