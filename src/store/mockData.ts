import type {
  Bill,
  Contract,
  DailyUsage,
  FaqItem,
  Inquiry,
  MonthlyUsage,
  Notification,
  PaymentMethod,
  PointHistory,
  User,
} from "../types";

// ─── User ────────────────────────────────────────────────────────

export const mockUser: User = {
  id: "user-001",
  name: "田中太郎",
  email: "tanaka@example.com",
  createdAt: "2022-04-01T00:00:00Z",
};

// ─── Contracts ───────────────────────────────────────────────────

export const mockContracts: Contract[] = [
  {
    id: "contract-001",
    userId: "user-001",
    address: "東京都渋谷区神南1-1-1",
    planName: "スタンダードプラン",
    ampere: 30,
    status: "active",
    startDate: "2022-04-01",
    paymentMethodId: "pm-001",
  },
  {
    id: "contract-002",
    userId: "user-001",
    address: "神奈川県横浜市中区山下町1-1",
    planName: "エコプラン",
    ampere: 20,
    status: "active",
    startDate: "2023-01-15",
    paymentMethodId: "pm-002",
  },
];

// ─── Monthly Usage ────────────────────────────────────────────────
// 各契約24ヶ月分: 2024年4月〜2026年3月

function kwhForMonth(month: number, seed: number): number {
  if (month === 7 || month === 8) {
    return Math.floor(350 + seed * 70); // 夏: 350-420
  } else if (month === 12 || month === 1) {
    return Math.floor(330 + seed * 70); // 冬: 330-400
  } else {
    return Math.floor(200 + seed * 80); // 春秋: 200-280
  }
}

function generateMonthlyUsage(
  contractId: string,
  baseVariation: number,
): MonthlyUsage[] {
  const data: MonthlyUsage[] = [];
  // 2024年4月〜2026年3月 (24ヶ月)
  for (let i = 0; i < 24; i++) {
    const totalMonths = 2024 * 12 + 3 + i; // 2024年4月を基点
    const year = Math.floor(totalMonths / 12);
    const month = totalMonths % 12 || 12;
    const adjustedYear = month === 12 ? year - 1 : year;

    // 擬似ランダムシード（再現可能）
    const seed = ((i * 7 + contractId.charCodeAt(9)) % 10) / 10;
    const kwh = kwhForMonth(month, seed + baseVariation * 0.1);

    // 2026年3月（当月）は予測付き
    if (adjustedYear === 2026 && month === 3) {
      const partialKwh = Math.floor(kwh * (9 / 31)); // 9日分
      const forecastKwh = kwh;
      const forecastAmount = Math.floor(
        30 * 55 + forecastKwh * 22 + forecastKwh * 1.15,
      );
      data.push({
        contractId,
        year: adjustedYear,
        month,
        kwh: partialKwh,
        forecastKwh,
        forecastAmount,
      });
    } else {
      data.push({ contractId, year: adjustedYear, month, kwh });
    }
  }
  return data;
}

export const mockMonthlyUsage: MonthlyUsage[] = [
  ...generateMonthlyUsage("contract-001", 0),
  ...generateMonthlyUsage("contract-002", 2),
];

// ─── Daily Usage ──────────────────────────────────────────────────
// 各契約: 直近3ヶ月分 (2025年12月〜2026年3月9日)

function generateDailyUsage(contractId: string, offset: number): DailyUsage[] {
  const data: DailyUsage[] = [];

  // 2025年12月
  for (let d = 1; d <= 31; d++) {
    const seed = ((d * 3 + offset) % 7) / 7;
    data.push({
      contractId,
      year: 2025,
      month: 12,
      day: d,
      kwh: parseFloat((8 + seed * 7).toFixed(1)),
    });
  }

  // 2026年1月
  for (let d = 1; d <= 31; d++) {
    const seed = ((d * 5 + offset) % 7) / 7;
    data.push({
      contractId,
      year: 2026,
      month: 1,
      day: d,
      kwh: parseFloat((8 + seed * 7).toFixed(1)),
    });
  }

  // 2026年2月
  for (let d = 1; d <= 28; d++) {
    const seed = ((d * 4 + offset) % 7) / 7;
    data.push({
      contractId,
      year: 2026,
      month: 2,
      day: d,
      kwh: parseFloat((8 + seed * 7).toFixed(1)),
    });
  }

  // 2026年3月（9日分まで）
  for (let d = 1; d <= 9; d++) {
    const seed = ((d * 6 + offset) % 7) / 7;
    data.push({
      contractId,
      year: 2026,
      month: 3,
      day: d,
      kwh: parseFloat((8 + seed * 7).toFixed(1)),
    });
  }

  return data;
}

export const mockDailyUsage: DailyUsage[] = [
  ...generateDailyUsage("contract-001", 0),
  ...generateDailyUsage("contract-002", 3),
];

// ─── Bills ───────────────────────────────────────────────────────
// 各契約12ヶ月分: 2025年4月〜2026年3月

function calcBill(
  contractId: string,
  ampere: number,
  year: number,
  month: number,
  kwh: number,
): Bill {
  const baseCharge = ampere * 55;
  const usageCharge = kwh * 22;
  const fuelAdjustment = Math.floor(kwh * 1.15);
  const totalAmount = baseCharge + usageCharge + fuelAdjustment;

  const isPaid = !(year === 2026 && month === 3);
  const dueMonth = month === 12 ? 1 : month + 1;
  const dueYear = month === 12 ? year + 1 : year;

  return {
    id: `bill-${contractId}-${year}${String(month).padStart(2, "0")}`,
    contractId,
    year,
    month,
    totalAmount,
    baseCharge,
    usageCharge,
    fuelAdjustment,
    kwh,
    status: !isPaid ? "unpaid" : "paid",
    dueDate: `${dueYear}-${String(dueMonth).padStart(2, "0")}-30`,
    paidAt: isPaid
      ? `${year}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, "0")}-15T10:00:00Z`
      : undefined,
  };
}

function generateBills(contractId: string, ampere: number): Bill[] {
  const bills: Bill[] = [];
  for (let i = 0; i < 12; i++) {
    const totalMonths = 2025 * 12 + 3 + i; // 2025年4月基点
    const year = Math.floor(totalMonths / 12);
    const month = totalMonths % 12 || 12;
    const adjustedYear = month === 12 ? year - 1 : year;

    const usageArr = mockMonthlyUsage.filter(
      (u) =>
        u.contractId === contractId &&
        u.year === adjustedYear &&
        u.month === month,
    );
    const kwh =
      usageArr.length > 0 ? (usageArr[0].forecastKwh ?? usageArr[0].kwh) : 250;
    bills.push(calcBill(contractId, ampere, adjustedYear, month, kwh));
  }
  return bills;
}

export const mockBills: Bill[] = [
  ...generateBills("contract-001", 30),
  ...generateBills("contract-002", 20),
];

// ─── Notifications ────────────────────────────────────────────────

export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    userId: "user-001",
    type: "bill_issued",
    title: "請求書が発行されました",
    body: "2026年3月分の請求書が発行されました（¥8,420）",
    isRead: false,
    relatedId: "bill-contract-001-202603",
    relatedUrl: "/billing",
    createdAt: "2026-03-01T09:00:00Z",
  },
  {
    id: "notif-002",
    userId: "user-001",
    type: "bill_due",
    title: "お支払期限が近づいています",
    body: "お支払期限が3日後に迫っています（¥8,420）",
    isRead: true,
    relatedId: "bill-contract-001-202602",
    relatedUrl: "/billing",
    createdAt: "2026-02-25T09:00:00Z",
  },
  {
    id: "notif-003",
    userId: "user-001",
    type: "usage_alert",
    title: "電気使用量が増加しています",
    body: "今月の使用量が先月より23%多くなっています",
    isRead: false,
    relatedUrl: "/electricity",
    createdAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "notif-004",
    userId: "user-001",
    type: "contract_update",
    title: "申請が完了しました",
    body: "プラン変更の申請が完了しました",
    isRead: true,
    createdAt: "2026-01-15T14:00:00Z",
  },
  {
    id: "notif-005",
    userId: "user-001",
    type: "points_expiring",
    title: "ポイントの有効期限が近づいています",
    body: "1,200ポイントが2026年4月30日に失効します",
    isRead: false,
    relatedUrl: "/points",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "notif-006",
    userId: "user-001",
    type: "campaign",
    title: "キャンペーンのお知らせ",
    body: "春の節電キャンペーン開始のお知らせ（2026年3月〜4月）",
    isRead: true,
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "notif-007",
    userId: "user-001",
    type: "system",
    title: "メンテナンスのお知らせ",
    body: "4月1日 2:00〜4:00 システムメンテナンスを実施します",
    isRead: true,
    createdAt: "2026-02-15T12:00:00Z",
  },
  {
    id: "notif-008",
    userId: "user-001",
    type: "contact_replied",
    title: "お問い合わせへの回答が届きました",
    body: "「料金について」へのご回答をお送りしました",
    isRead: true,
    relatedUrl: "/support/contact/history",
    createdAt: "2025-12-20T16:00:00Z",
  },
];

// ─── Point History ────────────────────────────────────────────────

export const mockPointHistory: PointHistory[] = [
  {
    id: "ph-001",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2028-04-30",
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ph-002",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2028-02-28",
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "ph-003",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2028-01-31",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "ph-004",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-12-31",
    createdAt: "2025-12-01T00:00:00Z",
  },
  {
    id: "ph-005",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-11-30",
    createdAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "ph-006",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-10-31",
    createdAt: "2025-10-01T00:00:00Z",
  },
  {
    id: "ph-007",
    userId: "user-001",
    type: "used",
    amount: -500,
    description: "電気代充当",
    createdAt: "2025-10-15T00:00:00Z",
  },
  {
    id: "ph-008",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-09-30",
    createdAt: "2025-09-01T00:00:00Z",
  },
  {
    id: "ph-009",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-08-31",
    createdAt: "2025-08-01T00:00:00Z",
  },
  {
    id: "ph-010",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-07-31",
    createdAt: "2025-07-01T00:00:00Z",
  },
  {
    id: "ph-011",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-06-30",
    createdAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "ph-012",
    userId: "user-001",
    type: "earned",
    amount: 200,
    description: "契約継続ボーナス",
    expiresAt: "2027-04-30",
    createdAt: "2025-04-01T00:00:00Z",
  },
];

export const mockPointBalance = 2400;
export const mockExpiringPoints = 1200;
export const mockExpiringDate = "2026-04-30";

// ─── Payment Methods ──────────────────────────────────────────────

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm-001",
    userId: "user-001",
    type: "credit_card",
    cardBrand: "visa",
    cardLast4: "1234",
    cardExpiry: "12/26",
    cardHolder: "TANAKA TARO",
    isDefault: true,
  },
  {
    id: "pm-002",
    userId: "user-001",
    type: "bank_transfer",
    bankName: "横浜銀行",
    accountNumber: "****5678",
    accountHolder: "タナカ タロウ",
    isDefault: false,
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────

export const mockFaqItems: FaqItem[] = [
  // 料金・請求
  {
    id: "faq-001",
    category: "billing",
    question: "電気料金はいつ引き落とされますか？",
    answer:
      "毎月20日前後にご登録の支払い方法から引き落とされます。クレジットカードの場合は各カード会社の引き落とし日に準じます。",
  },
  {
    id: "faq-002",
    category: "billing",
    question: "請求書はどこで確認できますか？",
    answer:
      "ポータルの「電気代」メニューから過去12ヶ月分の請求書をご確認いただけます。各請求書の詳細（内訳）も表示可能です。",
  },
  {
    id: "faq-003",
    category: "billing",
    question: "電気料金の計算方法を教えてください。",
    answer:
      "基本料金（アンペア数×55円）＋電力量料金（使用量kWh×22円）＋燃料費調整額（使用量kWh×1.15円）の合計です。",
  },

  // 電力使用量
  {
    id: "faq-004",
    category: "usage",
    question: "使用量の確認方法を教えてください。",
    answer:
      "「電気使用量」メニューから月別・日別の使用量グラフをご確認いただけます。前年同月との比較も可能です。",
  },
  {
    id: "faq-005",
    category: "usage",
    question: "使用量が急に増えた原因は何ですか？",
    answer:
      "季節変動（冷暖房）や家電の使用状況、住居人数の変化などが考えられます。日別グラフで特定の日に使用量が増えていないかご確認ください。",
  },
  {
    id: "faq-006",
    category: "usage",
    question: "月末の使用量予測はどのように計算されますか？",
    answer:
      "当月の日別使用量から1日あたりの平均を算出し、残り日数分を推計して月末予測値を表示しています。",
  },

  // お申し込み・変更
  {
    id: "faq-007",
    category: "contract",
    question: "プラン変更はいつから反映されますか？",
    answer: "申請月の翌月1日から新しいプランが適用されます。",
  },
  {
    id: "faq-008",
    category: "contract",
    question: "複数の住所で契約できますか？",
    answer:
      "はい、1つのアカウントで複数の住所に電力契約を持つことができます。各契約はポータル上でまとめて管理できます。",
  },
  {
    id: "faq-009",
    category: "contract",
    question: "新規申請から開通まで何日かかりますか？",
    answer:
      "通常、申請後5〜10営業日でご利用開始となります。工事が必要な場合は別途ご連絡します。",
  },

  // お支払い
  {
    id: "faq-010",
    category: "payment",
    question: "支払い方法を変更したい",
    answer:
      "「アカウント」→「支払い方法」から変更できます。変更は翌月請求分から反映されます。",
  },
  {
    id: "faq-011",
    category: "payment",
    question: "コンビニ払込票の手数料はいくらですか？",
    answer: "1回あたり110円（税込）の手数料がかかります。",
  },
  {
    id: "faq-012",
    category: "payment",
    question: "支払いが遅れた場合はどうなりますか？",
    answer:
      "支払期限（翌月末）を過ぎると延滞扱いとなります。お早めにお支払いください。",
  },

  // 引越し・解約
  {
    id: "faq-013",
    category: "move_terminate",
    question: "引越し時の手続きを教えてください。",
    answer:
      "「サービス」→「引越し申請」から新住所と引越し日をご入力ください。旧住所の解約と新住所の開通手続きを同時に行えます。",
  },
  {
    id: "faq-014",
    category: "move_terminate",
    question: "解約するにはどうすればいいですか？",
    answer:
      "「サービス」→「解約申請」から手続きできます。解約日は申請日から最短5営業日以降で指定可能です。",
  },
  {
    id: "faq-015",
    category: "move_terminate",
    question: "解約後に余ったポイントはどうなりますか？",
    answer:
      "全契約解約後、ポイントはアカウント退会時に失効します。退会前に電気代充当または他社ポイント交換をご利用ください。",
  },

  // ポイント
  {
    id: "faq-016",
    category: "points",
    question: "ポイントの有効期限はいつですか？",
    answer:
      "ポイント付与日から2年間有効です。失効30日前にお知らせでご通知します。",
  },
  {
    id: "faq-017",
    category: "points",
    question: "ポイントはどのように使えますか？",
    answer:
      "電気代への充当（1P=1円）または他社ポイント（Tポイント・楽天ポイント・dポイント・WAON）への交換が可能です。",
  },
  {
    id: "faq-018",
    category: "points",
    question: "ポイントはいつ付与されますか？",
    answer:
      "毎月の契約継続ボーナスとして月初に付与されます。キャンペーン時は別途付与されることがあります。",
  },

  // アカウント
  {
    id: "faq-019",
    category: "account",
    question: "パスワードを忘れた場合は？",
    answer:
      "ログイン画面の「パスワードをお忘れですか？」からメールアドレスを入力するとリセットリンクをお送りします。",
  },
  {
    id: "faq-020",
    category: "account",
    question: "メールアドレスを変更できますか？",
    answer:
      "現在、メールアドレスの変更はサポートへのお問い合わせで承っております。",
  },
  {
    id: "faq-021",
    category: "account",
    question: "退会するにはどうすればいいですか？",
    answer:
      "「アカウント」→「退会」から手続きできます。全ての契約を解約した後に退会申請が可能です。",
  },
];

// ─── Inquiries ────────────────────────────────────────────────────

export const mockInquiries: Inquiry[] = [
  {
    id: "inq-001",
    userId: "user-001",
    category: "billing",
    subject: "2025年12月の請求金額について",
    body: "12月の請求金額が例月より高い気がするのですが、内訳を詳しく教えていただけますか。",
    status: "answered",
    referenceNumber: "#20251205-001",
    createdAt: "2025-12-05T10:00:00Z",
    answeredAt: "2025-12-08T14:00:00Z",
  },
  {
    id: "inq-002",
    userId: "user-001",
    category: "contract",
    subject: "プラン変更の申請について",
    body: "エコプランへの変更を検討しています。変更後の料金シミュレーションを教えてください。",
    status: "open",
    referenceNumber: "#20260301-001",
    createdAt: "2026-03-01T11:00:00Z",
  },
];
