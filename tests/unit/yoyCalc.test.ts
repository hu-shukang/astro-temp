/**
 * YoYCard 内部の前年比計算ロジックを純粋関数として検証するユニットテスト。
 *
 * YoYCard コンポーネントは以下の計算式を使用している:
 *   diff = currentValue - previousValue
 *   pct  = previousValue > 0 ? (diff / previousValue * 100).toFixed(1) : "0.0"
 *
 * この計算ロジックをコンポーネントから独立して検証します。
 */
import { describe, expect, it } from "vitest";

/** YoYCard と同じ計算式を純粋関数として再現 */
function calcYoY(
  currentValue: number,
  previousValue: number,
): { diff: number; pct: string; isIncrease: boolean; isDecrease: boolean } {
  const diff = currentValue - previousValue;
  const pct =
    previousValue > 0 ? ((diff / previousValue) * 100).toFixed(1) : "0.0";
  return {
    diff,
    pct,
    isIncrease: diff > 0,
    isDecrease: diff < 0,
  };
}

describe("前年比（YoY）計算ロジック", () => {
  describe("増加ケース", () => {
    it("300 → 360: +20.0% と isIncrease=true", () => {
      const result = calcYoY(360, 300);
      expect(result.pct).toBe("20.0");
      expect(result.isIncrease).toBe(true);
      expect(result.isDecrease).toBe(false);
      expect(result.diff).toBe(60);
    });

    it("100 → 200: +100.0%", () => {
      const result = calcYoY(200, 100);
      expect(result.pct).toBe("100.0");
      expect(result.isIncrease).toBe(true);
    });

    it("端数: 300 → 310: 3.3% (3.333... を 1 桁に丸める)", () => {
      const result = calcYoY(310, 300);
      expect(result.pct).toBe("3.3");
      expect(result.isIncrease).toBe(true);
    });
  });

  describe("減少ケース", () => {
    it("300 → 240: -20.0% と isDecrease=true", () => {
      const result = calcYoY(240, 300);
      expect(result.pct).toBe("-20.0");
      expect(result.isDecrease).toBe(true);
      expect(result.isIncrease).toBe(false);
      expect(result.diff).toBe(-60);
    });

    it("200 → 100: -50.0%", () => {
      const result = calcYoY(100, 200);
      expect(result.pct).toBe("-50.0");
    });
  });

  describe("変化なしケース", () => {
    it("300 → 300: 0.0%, isIncrease=false, isDecrease=false", () => {
      const result = calcYoY(300, 300);
      expect(result.pct).toBe("0.0");
      expect(result.isIncrease).toBe(false);
      expect(result.isDecrease).toBe(false);
      expect(result.diff).toBe(0);
    });
  });

  describe("エッジケース", () => {
    it("前年が 0 のとき: ゼロ除算を防ぎ '0.0' を返す", () => {
      const result = calcYoY(100, 0);
      expect(result.pct).toBe("0.0");
    });

    it("両方 0 のとき: 0.0 を返す", () => {
      const result = calcYoY(0, 0);
      expect(result.pct).toBe("0.0");
      expect(result.diff).toBe(0);
    });

    it("currentValue が 0 で previousValue が正のとき: -100.0%", () => {
      const result = calcYoY(0, 100);
      expect(result.pct).toBe("-100.0");
      expect(result.isDecrease).toBe(true);
    });

    it("大きな値でも正しく計算する", () => {
      const result = calcYoY(15000, 12000);
      expect(result.pct).toBe("25.0");
      expect(result.diff).toBe(3000);
    });
  });
});
