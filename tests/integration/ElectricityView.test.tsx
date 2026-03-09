/**
 * ElectricityView — 統合テスト
 *
 * - Segmented Controls（月別/日別）の切り替え
 * - 月別ビュー: チャートエリアと「月別使用量」タイトルの表示
 * - 日別ビュー: 月ナビゲーション・月間合計・1日平均の表示
 * - isLoading 時の SkeletonChart 表示
 *
 * Recharts (ResizeObserver が必要) は vi.mock でダミーに置き換え、
 * Zustand ストアはモジュールモックで制御します。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

// ─── Recharts のモック ────────────────────────────────────────────────────────
// ブラウザモードでも ResizeObserver が期待通りに動作しない場合があるため、
// Recharts コンポーネントを軽量なダミーに置き換えます。
vi.mock("recharts", () => ({
  ResponsiveContainer: ({
    children,
  }: {
    children: React.ReactNode;
    width?: string | number;
    height?: number;
  }) => <div data-testid="recharts-container">{children}</div>,
  ComposedChart: ({
    children,
  }: {
    children: React.ReactNode;
    data?: unknown[];
    margin?: unknown;
  }) => <div data-testid="recharts-chart">{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ─── Zustand ストアのモック ────────────────────────────────────────────────────
vi.mock("../../src/store/contractStore", () => {
  let mockState = {
    contracts: [
      {
        id: "contract-001",
        address: "東京都渋谷区神南1-1-1",
        planName: "スタンダードプラン",
        ampere: 30,
      },
    ],
    selectedContractId: "contract-001",
    isLoading: false,
    setSelectedContract: vi.fn(),
    setLoading: vi.fn(),
  };

  return {
    useContractStore: vi.fn((selector: (s: typeof mockState) => unknown) =>
      selector(mockState),
    ),
    // テストから状態を上書きできるようにするユーティリティ
    __setMockState: (patch: Partial<typeof mockState>) => {
      mockState = { ...mockState, ...patch };
    },
    __resetMockState: () => {
      mockState = {
        contracts: [
          {
            id: "contract-001",
            address: "東京都渋谷区神南1-1-1",
            planName: "スタンダードプラン",
            ampere: 30,
          },
        ],
        selectedContractId: "contract-001",
        isLoading: false,
        setSelectedContract: vi.fn(),
        setLoading: vi.fn(),
      };
    },
  };
});

import { ElectricityView } from "../../src/components/electricity/ElectricityView";

async function setMockState(patch: { isLoading?: boolean }) {
  const mod = await import("../../src/store/contractStore");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mod as any).__setMockState(patch);
}

async function resetMockState() {
  const mod = await import("../../src/store/contractStore");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mod as any).__resetMockState();
}

describe("ElectricityView", () => {
  beforeEach(async () => {
    await resetMockState();
    // URL クエリパラメータをリセット
    window.history.replaceState({}, "", "/electricity");
  });

  describe("初期表示（月別ビュー）", () => {
    it("ページタイトル「電気使用量」が表示される", async () => {
      const screen = await render(<ElectricityView />);

      await expect
        .element(screen.getByRole("heading", { level: 1 }))
        .toHaveTextContent("電気使用量");
    });

    it("デフォルトで「月別」タブがアクティブ状態になっている", async () => {
      const screen = await render(<ElectricityView />);

      // アクティブなボタンは bg-primary クラスを持つ
      const monthlyBtn = screen.getByRole("button", { name: "月別" });
      await expect.element(monthlyBtn).toBeInTheDocument();
      // アクティブタブは text-white クラスを持つ（bg-primary 適用時）
      await expect.element(monthlyBtn).toHaveClass("bg-primary");
    });

    it("「日別」タブは非アクティブ状態", async () => {
      const screen = await render(<ElectricityView />);

      const dailyBtn = screen.getByRole("button", { name: "日別" });
      await expect.element(dailyBtn).not.toHaveClass("bg-primary");
    });

    it("「月別使用量（過去12ヶ月）」の見出しが表示される", async () => {
      const screen = await render(<ElectricityView />);

      await expect
        .element(screen.getByText("月別使用量（過去12ヶ月）"))
        .toBeInTheDocument();
    });

    it("Recharts のチャートコンテナが存在する", async () => {
      const screen = await render(<ElectricityView />);

      await expect
        .element(screen.getByTestId("recharts-container"))
        .toBeInTheDocument();
    });
  });

  describe("ビューの切り替え", () => {
    it("「日別」タブをクリックすると日別ビューに切り替わる", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      // 日別ビューの月ナビゲーションが表示される
      await expect
        .element(screen.getByRole("button", { name: "前月" }))
        .toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "次月" }))
        .toBeInTheDocument();
    });

    it("「日別」タブに切り替えると「月別使用量」見出しが消える", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      await expect
        .element(screen.getByText("月別使用量（過去12ヶ月）"))
        .not.toBeInTheDocument();
    });

    it("「日別」→「月別」に戻すと月別ビューが再表示される", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();
      await screen.getByRole("button", { name: "月別" }).click();

      await expect
        .element(screen.getByText("月別使用量（過去12ヶ月）"))
        .toBeInTheDocument();
    });

    it("「日別」クリック後、URL に ?view=daily が付く", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      expect(window.location.search).toContain("view=daily");
    });

    it("「月別」クリック後、URL に ?view=monthly が付く", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();
      await screen.getByRole("button", { name: "月別" }).click();

      expect(window.location.search).toContain("view=monthly");
    });
  });

  describe("日別ビュー", () => {
    it("初期表示月は 2026年3月", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      await expect.element(screen.getByText("2026年3月")).toBeInTheDocument();
    });

    it("「前月」ボタンをクリックすると 2026年2月 に移動する", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();
      await screen.getByRole("button", { name: "前月" }).click();

      await expect.element(screen.getByText("2026年2月")).toBeInTheDocument();
    });

    it("最新月（2026年3月）では「次月」ボタンが disabled になっている", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      await expect
        .element(screen.getByRole("button", { name: "次月" }))
        .toBeDisabled();
    });

    it("前月に移動すると「次月」ボタンが有効になる", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();
      await screen.getByRole("button", { name: "前月" }).click();

      await expect
        .element(screen.getByRole("button", { name: "次月" }))
        .toBeEnabled();
    });

    it("「月間合計」ラベルが表示される", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      await expect.element(screen.getByText("月間合計")).toBeInTheDocument();
    });

    it("「1日平均」ラベルが表示される", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      await expect.element(screen.getByText("1日平均")).toBeInTheDocument();
    });

    it("月間合計と 1日平均の単位が正しく表示される", async () => {
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      // 月間合計の単位
      await expect.element(screen.getByText("kWh").first()).toBeInTheDocument();
      // 1日平均の単位
      await expect.element(screen.getByText("kWh/日")).toBeInTheDocument();
    });
  });

  describe("ローディング状態", () => {
    it("isLoading=true のとき月別ビューで SkeletonChart が表示される", async () => {
      await setMockState({ isLoading: true });
      const screen = await render(<ElectricityView />);

      // SkeletonChart は animate-pulse クラスを持つ div を含む
      const skeletons = screen.container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);

      // 月別使用量の見出しは表示されない
      await expect
        .element(screen.getByText("月別使用量（過去12ヶ月）"))
        .not.toBeInTheDocument();
    });

    it("isLoading=true のとき日別ビューで SkeletonChart が表示される", async () => {
      await setMockState({ isLoading: true });
      const screen = await render(<ElectricityView />);

      await screen.getByRole("button", { name: "日別" }).click();

      const skeletons = screen.container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);

      // 月間合計は表示されない
      await expect
        .element(screen.getByText("月間合計"))
        .not.toBeInTheDocument();
    });
  });

  describe("URL クエリパラメータからの初期ビュー読み取り", () => {
    it("?view=daily で始まると日別ビューが初期表示される", async () => {
      window.history.replaceState({}, "", "/electricity?view=daily");

      const screen = await render(<ElectricityView />);

      await expect
        .element(screen.getByRole("button", { name: "前月" }))
        .toBeInTheDocument();
    });

    it("?view=monthly で始まると月別ビューが初期表示される", async () => {
      window.history.replaceState({}, "", "/electricity?view=monthly");

      const screen = await render(<ElectricityView />);

      await expect
        .element(screen.getByText("月別使用量（過去12ヶ月）"))
        .toBeInTheDocument();
    });

    it("不正な view パラメータは月別ビューにフォールバックする", async () => {
      window.history.replaceState({}, "", "/electricity?view=unknown");

      const screen = await render(<ElectricityView />);

      await expect
        .element(screen.getByText("月別使用量（過去12ヶ月）"))
        .toBeInTheDocument();
    });
  });
});
