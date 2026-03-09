/**
 * ElectricityPage — Page Object Model
 *
 * /electricity ページの共通操作をカプセル化します。
 */
import type { Locator, Page } from "@playwright/test";

export class ElectricityPage {
  readonly page: Page;

  // ── ロケーター ────────────────────────────────────────────────────────────
  readonly heading: Locator;
  readonly monthlyTab: Locator;
  readonly dailyTab: Locator;
  readonly prevMonthButton: Locator;
  readonly nextMonthButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: "電気使用量" });
    this.monthlyTab = page.getByRole("button", { name: "月別" });
    this.dailyTab = page.getByRole("button", { name: "日別" });
    this.prevMonthButton = page.getByRole("button", { name: "前月" });
    this.nextMonthButton = page.getByRole("button", { name: "次月" });
  }

  /** /electricity に移動して React island のハイドレーションを待つ */
  async goto() {
    // networkidle でスクリプト読み込み・React hydration の完了を待つ
    await this.page.goto("/electricity", { waitUntil: "networkidle" });
    await this.heading.waitFor({ state: "visible" });
  }

  /** 日別タブに切り替え、日別コンテンツが表示されるまで待つ */
  async switchToDaily() {
    await this.dailyTab.click();
    // prevMonthButton ではなく日別ビュー固有のコンテンツが出るまで待つ
    await this.page.getByText("月間合計").waitFor({ state: "visible" });
  }

  /** 月別タブに切り替え、月別使用量の見出しが表示されるまで待つ */
  async switchToMonthly() {
    await this.monthlyTab.click();
    await this.page
      .getByText("月別使用量（過去12ヶ月）")
      .waitFor({ state: "visible" });
  }

  /** 現在表示中の年月テキストを返す (例: "2026年3月") */
  async getCurrentMonthLabel(): Promise<string> {
    // h3 タイトル（年月表示）を取得
    const heading = this.page.locator("h3").filter({ hasText: /\d{4}年\d+月/ });
    return heading.innerText();
  }
}
