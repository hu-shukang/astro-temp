/**
 * ContractSelector — 統合テスト
 *
 * Zustand ストアをモックして ContractSelector の
 * 表示・ドロップダウン開閉・契約切り替え・外部クリック閉じる
 * 動作を検証します。
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

// Zustand ストアをモジュールレベルでモック
// vi.mock はホイストされるため import より前に宣言してもよい
vi.mock("../../src/store/contractStore", () => {
  const mockSetSelectedContract = vi.fn();

  return {
    useContractStore: vi.fn((selector: (s: unknown) => unknown) => {
      const state = {
        contracts: [
          {
            id: "contract-001",
            address: "東京都渋谷区神南1-1-1",
            planName: "スタンダードプラン",
            ampere: 30,
          },
          {
            id: "contract-002",
            address: "神奈川県横浜市中区山下町1-1",
            planName: "エコプラン",
            ampere: 20,
          },
        ],
        selectedContractId: "contract-001",
        isLoading: false,
        setSelectedContract: mockSetSelectedContract,
      };
      return selector(state);
    }),
    // テスト間でモック関数をリセットできるよう外部から参照可能にする
    __mockSetSelectedContract: mockSetSelectedContract,
  };
});

import { ContractSelector } from "../../src/components/ui/ContractSelector";

// テスト用のモック関数参照を取得するヘルパー
async function getMockSetSelectedContract() {
  const mod = await import("../../src/store/contractStore");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).__mockSetSelectedContract as ReturnType<typeof vi.fn>;
}

describe("ContractSelector", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("初期表示", () => {
    it("選択中の契約の住所を表示する", async () => {
      const screen = await render(<ContractSelector />);

      await expect
        .element(screen.getByText("東京都渋谷区神南1-1-1"))
        .toBeInTheDocument();
    });

    it("初期状態ではドロップダウンが閉じている", async () => {
      const screen = await render(<ContractSelector />);

      // role="listbox" の要素は存在しない
      expect(screen.getByRole("listbox")).not.toBeInTheDocument();
    });

    it("トリガーボタンに aria-expanded='false' が設定されている", async () => {
      const screen = await render(<ContractSelector />);

      await expect
        .element(screen.getByRole("button", { name: /東京都渋谷区/ }))
        .toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("ドロップダウンの開閉", () => {
    it("トリガーボタンをクリックするとドロップダウンが開く", async () => {
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();

      await expect.element(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("ドロップダウン開放時、全ての契約が一覧表示される", async () => {
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();

      await expect
        .element(screen.getByText("神奈川県横浜市中区山下町1-1"))
        .toBeInTheDocument();
    });

    it("ドロップダウン開放時、プラン名とアンペアが表示される", async () => {
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();

      await expect
        .element(screen.getByText(/スタンダードプラン.*30A/))
        .toBeInTheDocument();
      await expect
        .element(screen.getByText(/エコプラン.*20A/))
        .toBeInTheDocument();
    });

    it("ドロップダウン開放時、選択中の契約にチェックマークが付く", async () => {
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();

      // 選択中の契約には "✓ " プレフィックスが付く
      await expect
        .element(screen.getByText(/✓.*東京都渋谷区神南1-1-1/))
        .toBeInTheDocument();
    });

    it("ドロップダウン開放時、aria-expanded が 'true' になる", async () => {
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();

      await expect
        .element(screen.getByRole("button", { name: /東京都渋谷区/ }))
        .toHaveAttribute("aria-expanded", "true");
    });

    it("新規契約リンクが表示される", async () => {
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();

      await expect
        .element(screen.getByRole("link", { name: /新規契約を申し込む/ }))
        .toBeInTheDocument();
    });
  });

  describe("契約の切り替え", () => {
    it("別の契約をクリックすると setSelectedContract が呼ばれる", async () => {
      const setSelectedContract = await getMockSetSelectedContract();
      const screen = await render(<ContractSelector />);

      // ドロップダウンを開く
      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();

      // 2 番目の契約を選択
      await screen.getByRole("option", { name: /神奈川県横浜市/ }).click();

      expect(setSelectedContract).toHaveBeenCalledOnce();
      expect(setSelectedContract).toHaveBeenCalledWith("contract-002");
    });

    it("契約を選択するとドロップダウンが閉じる", async () => {
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();
      await screen.getByRole("option", { name: /神奈川県横浜市/ }).click();

      // listbox が消えるまで待機
      await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    });

    it("現在選択中の契約をクリックしても setSelectedContract が呼ばれる", async () => {
      const setSelectedContract = await getMockSetSelectedContract();
      const screen = await render(<ContractSelector />);

      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();
      await screen.getByRole("option", { name: /✓.*東京都渋谷区/ }).click();

      expect(setSelectedContract).toHaveBeenCalledWith("contract-001");
    });
  });

  describe("外部クリックで閉じる", () => {
    it("コンポーネント外側をクリックするとドロップダウンが閉じる", async () => {
      const screen = await render(
        <div>
          <ContractSelector />
          <button type="button" data-testid="outside">
            外部ボタン
          </button>
        </div>,
      );

      // ドロップダウンを開く
      await screen.getByRole("button", { name: /東京都渋谷区/ }).click();
      await expect.element(screen.getByRole("listbox")).toBeInTheDocument();

      // 外部クリック
      await screen.getByTestId("outside").click();

      await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    });
  });
});
