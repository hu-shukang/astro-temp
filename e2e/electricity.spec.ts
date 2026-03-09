/**
 * electricity E2E テスト
 *
 * 実際の Astro dev サーバー上で /electricity ページを操作し、
 * React island のハイドレーション・ビュー切り替え・URL 変化・
 * 月ナビゲーションを検証します。
 */
import { expect, test } from "@playwright/test";
import { ElectricityPage } from "./pages/electricity.page";

test.describe("電気使用量ページ (/electricity)", () => {
  test.describe("ページ読み込み", () => {
    test("タイトル「電気使用量」が表示される", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await expect(electricityPage.heading).toBeVisible();
    });

    test("ページタイトル（<title>）に「電気使用量」が含まれる", async ({
      page,
    }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await expect(page).toHaveTitle(/電気使用量/);
    });

    test("「月別」と「日別」の Segmented Control が表示される", async ({
      page,
    }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await expect(electricityPage.monthlyTab).toBeVisible();
      await expect(electricityPage.dailyTab).toBeVisible();
    });

    test("ContractSelector（契約切り替えドロップダウン）が表示される", async ({
      page,
    }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      // ContractSelector のトリガーボタンはアドレス文字列を含む
      await expect(
        page.getByRole("button", { name: /区|町|市/ }),
      ).toBeVisible();
    });
  });

  test.describe("月別ビュー（デフォルト）", () => {
    test("デフォルトで月別コンテンツが表示される", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await expect(page.getByText("月別使用量（過去12ヶ月）")).toBeVisible();
    });

    test("URL に ?view パラメータがない状態で月別が表示される", async ({
      page,
    }) => {
      await page.goto("/electricity");

      await expect(page.getByText("月別使用量（過去12ヶ月）")).toBeVisible();
      // デフォルトでは URL に view パラメータはない
      expect(page.url()).not.toMatch(/view=daily/);
    });

    test("月別グラフエリアが存在する（recharts container）", async ({
      page,
    }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      // svg 要素または recharts が描画するキャンバスが存在する
      // 実際のブラウザでは recharts が SVG をレンダリングする
      const chartArea = page.locator(".recharts-wrapper, svg").first();
      await expect(chartArea).toBeAttached();
    });
  });

  test.describe("「日別」タブへの切り替え", () => {
    test("「日別」クリックで URL に ?view=daily が付く", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();

      await expect(page).toHaveURL(/[?&]view=daily/);
    });

    test("「日別」クリックで月ナビゲーションが表示される", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();

      await expect(electricityPage.prevMonthButton).toBeVisible();
      await expect(electricityPage.nextMonthButton).toBeVisible();
    });

    test("「日別」切り替え後に現在月（2026年3月）が表示される", async ({
      page,
    }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();

      await expect(page.getByText("2026年3月")).toBeVisible();
    });

    test("日別ビューで「月間合計」と「1日平均」が表示される", async ({
      page,
    }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();

      await expect(page.getByText("月間合計")).toBeVisible();
      await expect(page.getByText("1日平均")).toBeVisible();
    });

    test("最新月では「次月」ボタンが disabled", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();

      await expect(electricityPage.nextMonthButton).toBeDisabled();
    });
  });

  test.describe("「月別」タブに戻る", () => {
    test("「日別」→「月別」に戻ると月別コンテンツが再表示される", async ({
      page,
    }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();
      await electricityPage.switchToMonthly();

      await expect(page.getByText("月別使用量（過去12ヶ月）")).toBeVisible();
    });

    test("「月別」に戻ると URL が ?view=monthly になる", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();
      await electricityPage.switchToMonthly();

      await expect(page).toHaveURL(/[?&]view=monthly/);
    });

    test("「月別」に戻ると月ナビゲーションが消える", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();
      await electricityPage.switchToMonthly();

      await expect(electricityPage.prevMonthButton).not.toBeVisible();
    });
  });

  test.describe("日別ビュー: 月ナビゲーション", () => {
    test("「前月」クリックで前月（2026年2月）に移動する", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();
      await electricityPage.prevMonthButton.click();

      await expect(page.getByText("2026年2月")).toBeVisible();
    });

    test("前月に移動すると「次月」ボタンが有効になる", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();
      await electricityPage.prevMonthButton.click();

      await expect(electricityPage.nextMonthButton).toBeEnabled();
    });

    test("「次月」クリックで次月（2026年3月）に戻れる", async ({ page }) => {
      const electricityPage = new ElectricityPage(page);
      await electricityPage.goto();

      await electricityPage.switchToDaily();
      await electricityPage.prevMonthButton.click(); // → 2月
      await electricityPage.nextMonthButton.click(); // → 3月

      await expect(page.getByText("2026年3月")).toBeVisible();
    });
  });

  test.describe("URL クエリパラメータからの直接アクセス", () => {
    test("?view=daily で直接アクセスすると日別ビューが表示される", async ({
      page,
    }) => {
      await page.goto("/electricity?view=daily");

      // React hydration 待機
      await page
        .getByRole("heading", { level: 1, name: "電気使用量" })
        .waitFor({ state: "visible" });

      await expect(page.getByRole("button", { name: "前月" })).toBeVisible();
      await expect(page.getByText("月間合計")).toBeVisible();
    });

    test("?view=monthly で直接アクセスすると月別ビューが表示される", async ({
      page,
    }) => {
      await page.goto("/electricity?view=monthly");

      await page
        .getByRole("heading", { level: 1, name: "電気使用量" })
        .waitFor({ state: "visible" });

      await expect(page.getByText("月別使用量（過去12ヶ月）")).toBeVisible();
    });
  });
});
