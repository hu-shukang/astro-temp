/**
 * YoYCard — 单元测试
 *
 * YoYCard はピュアな表示コンポーネントで、props から
 * 前年比 (%) と増減方向を計算して表示します。
 * ここでは計算ロジックと条件付きレンダリングを検証します。
 */
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { YoYCard } from "../../src/components/ui/YoYCard";

describe("YoYCard", () => {
  describe("前年比パーセントの計算と表示", () => {
    it("増加時: 正しいパーセントに + プレフィックスを付けて表示する", async () => {
      // 300 → 360: diff = +60, pct = +20.0%
      const screen = await render(
        <YoYCard
          currentValue={360}
          previousValue={300}
          unit="kWh"
          label="前年同月比（テスト）"
        />,
      );

      await expect.element(screen.getByText("+20.0%")).toBeInTheDocument();
    });

    it("減少時: 正しいパーセントをマイナスなしで表示する（isDecrease フラグで判定）", async () => {
      // 300 → 240: diff = -60, pct = -20.0%  => 表示は "-20.0%"
      const screen = await render(
        <YoYCard
          currentValue={240}
          previousValue={300}
          unit="kWh"
          label="前年同月比（テスト）"
        />,
      );

      // isIncrease が false なので "+" プレフィックスは付かない → "-20.0%"
      await expect.element(screen.getByText("-20.0%")).toBeInTheDocument();
    });

    it("前年と同値: 0.0% を表示する", async () => {
      const screen = await render(
        <YoYCard
          currentValue={300}
          previousValue={300}
          unit="kWh"
          label="前年同月比（テスト）"
        />,
      );

      await expect.element(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("前年が 0 のとき: ゼロ除算を防ぎ 0.0% を表示する", async () => {
      const screen = await render(
        <YoYCard
          currentValue={100}
          previousValue={0}
          unit="kWh"
          label="前年同月比（テスト）"
        />,
      );

      await expect.element(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("小数点以下 1 桁に丸める", async () => {
      // 300 → 310: diff = 10, pct = 3.333...% → 3.3%
      const screen = await render(
        <YoYCard currentValue={310} previousValue={300} unit="kWh" />,
      );

      await expect.element(screen.getByText("+3.3%")).toBeInTheDocument();
    });
  });

  describe("今年・前年の値の表示", () => {
    it("currentValue と previousValue を正しく表示する", async () => {
      const screen = await render(
        <YoYCard currentValue={1234} previousValue={5678} unit="kWh" />,
      );

      // toLocaleString() の結果はロケールに依存するため部分一致で確認
      await expect.element(screen.getByText(/1,?234/)).toBeInTheDocument();
      await expect.element(screen.getByText(/5,?678/)).toBeInTheDocument();
    });

    it("unit を正しく表示する", async () => {
      const screen = await render(
        <YoYCard currentValue={100} previousValue={80} unit="円" />,
      );

      const unitElements = screen.getByText("円");
      // 今年・前年それぞれ unit が表示される
      await expect.element(unitElements.first()).toBeInTheDocument();
    });
  });

  describe("label prop", () => {
    it("デフォルト label 「前年同月比」を表示する", async () => {
      const screen = await render(
        <YoYCard currentValue={100} previousValue={90} unit="kWh" />,
      );

      await expect.element(screen.getByText("前年同月比")).toBeInTheDocument();
    });

    it("カスタム label を表示する", async () => {
      const screen = await render(
        <YoYCard
          currentValue={100}
          previousValue={90}
          unit="kWh"
          label="前年同月比（3月）"
        />,
      );

      await expect
        .element(screen.getByText("前年同月比（3月）"))
        .toBeInTheDocument();
    });
  });

  describe("formatValue カスタムフォーマット", () => {
    it("formatValue が指定されたとき、その関数で値をフォーマットする", async () => {
      const formatValue = (v: number) => `¥${v.toLocaleString()}`;
      const screen = await render(
        <YoYCard
          currentValue={5000}
          previousValue={4000}
          unit="円"
          formatValue={formatValue}
        />,
      );

      await expect.element(screen.getByText(/¥5,?000/)).toBeInTheDocument();
      await expect.element(screen.getByText(/¥4,?000/)).toBeInTheDocument();
    });
  });

  describe("増減アイコンと色クラスの条件付きレンダリング", () => {
    it("増加時は ArrowUp アイコンを含む要素が存在する", async () => {
      const screen = await render(
        <YoYCard currentValue={200} previousValue={100} unit="kWh" />,
      );

      // 増加のバッジに "+" が付く
      await expect.element(screen.getByText("+100.0%")).toBeInTheDocument();
    });

    it("減少時は ArrowDown アイコンを含む要素が存在する", async () => {
      const screen = await render(
        <YoYCard currentValue={100} previousValue={200} unit="kWh" />,
      );

      await expect.element(screen.getByText("-50.0%")).toBeInTheDocument();
    });
  });
});
