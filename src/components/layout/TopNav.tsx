import { useEffect, useRef } from "react";
import { useNotificationStore } from "../../store/notificationStore";
import { useUiStore } from "../../store/uiStore";

interface DropdownItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdownKey?: string;
  items?: DropdownItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", href: "/" },
  {
    label: "電気",
    dropdownKey: "electricity",
    items: [
      { label: "電気使用量", href: "/electricity" },
      { label: "電気代", href: "/billing" },
    ],
  },
  { label: "お知らせ", href: "/notifications" },
  {
    label: "サービス",
    dropdownKey: "service",
    items: [
      { label: "ポイント", href: "/points" },
      { label: "新規申請", href: "/service/apply" },
      { label: "プラン変更", href: "/service/change-plan" },
      { label: "解約申請", href: "/service/terminate" },
      { label: "他社切替", href: "/service/transfer" },
      { label: "引越し申請", href: "/service/move" },
    ],
  },
  {
    label: "サポート",
    dropdownKey: "support",
    items: [
      { label: "よくある質問", href: "/support/faq" },
      { label: "お問い合わせ", href: "/support/contact" },
    ],
  },
];

const USER_MENU_ITEMS: DropdownItem[] = [
  { label: "プロフィール", href: "/account/profile" },
  { label: "支払い方法", href: "/account/payment" },
  { label: "退会", href: "/account/withdraw" },
];

function isActive(href: string): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (href === "/") return path === "/";
  return path.startsWith(href);
}

export default function TopNav() {
  const { unreadCount } = useNotificationStore();
  const {
    activeDropdown,
    setActiveDropdown,
    isMobileMenuOpen,
    toggleMobileMenu,
  } = useUiStore();

  const navRef = useRef<HTMLElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setActiveDropdown]);

  const handleDropdownToggle = (key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  const handleNavClick = () => {
    setActiveDropdown(null);
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  return (
    <nav
      ref={navRef}
      className="bg-surface border-border fixed top-0 right-0 left-0 z-50 border-b"
      style={{ height: "var(--topnav-height)" }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* ロゴ */}
        <a
          href="/"
          className="font-heading text-primary mr-8 text-xl font-bold whitespace-nowrap"
        >
          でんきポータル
        </a>

        {/* デスクトップナビゲーション */}
        <div className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            if (item.dropdownKey) {
              const isOpen = activeDropdown === item.dropdownKey;
              return (
                <div key={item.dropdownKey} className="relative">
                  <button
                    onClick={() => handleDropdownToggle(item.dropdownKey!)}
                    className={`hover:text-primary flex cursor-pointer items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                      isOpen ? "text-primary" : "text-text"
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="bg-surface border-border absolute top-full left-0 mt-1 min-w-[160px] rounded-md border shadow-md">
                      {/* サービスメニューのみポイントの後に区切り線 */}
                      {item.dropdownKey === "service"
                        ? item.items?.map((sub, i) => (
                            <div key={sub.href}>
                              <a
                                href={sub.href}
                                onClick={handleNavClick}
                                className="hover:bg-background text-text block px-4 py-2 text-sm transition-colors"
                              >
                                {sub.label}
                              </a>
                              {i === 0 && (
                                <div className="border-border my-1 border-t" />
                              )}
                            </div>
                          ))
                        : item.items?.map((sub) => (
                            <a
                              key={sub.href}
                              href={sub.href}
                              onClick={handleNavClick}
                              className="hover:bg-background text-text block px-4 py-2 text-sm transition-colors"
                            >
                              {sub.label}
                            </a>
                          ))}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(item.href!);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`relative flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-primary border-primary border-b-2"
                    : "text-text hover:text-primary"
                }`}
              >
                {item.label}
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="bg-danger absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* ユーザーメニュー（デスクトップ） */}
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {/* 通知ベル */}
          <a
            href="/notifications"
            className="text-text-muted hover:text-primary relative p-1 transition-colors"
            aria-label="お知らせ"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="bg-danger absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </a>

          {/* ユーザーアバター */}
          <div className="relative">
            <button
              onClick={() => handleDropdownToggle("user")}
              className="hover:bg-background flex cursor-pointer items-center gap-2 rounded-full p-1 transition-colors"
              aria-label="ユーザーメニュー"
            >
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <svg
                className={`text-text-muted h-4 w-4 transition-transform ${activeDropdown === "user" ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {activeDropdown === "user" && (
              <div className="bg-surface border-border absolute top-full right-0 mt-1 min-w-[160px] rounded-md border shadow-md">
                {USER_MENU_ITEMS.map((item, i) => (
                  <div key={item.href}>
                    {(i === 1 || i === USER_MENU_ITEMS.length - 1) && i > 0 && (
                      <div className="border-border my-1 border-t" />
                    )}
                    <a
                      href={item.href}
                      onClick={handleNavClick}
                      className="hover:bg-background text-text block px-4 py-2 text-sm transition-colors"
                    >
                      {item.label}
                    </a>
                  </div>
                ))}
                <div className="border-border my-1 border-t" />
                <button
                  onClick={() => {
                    handleNavClick();
                    window.location.href = "/auth/login";
                  }}
                  className="text-danger hover:bg-background w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>

        {/* モバイルハンバーガー */}
        <button
          onClick={toggleMobileMenu}
          className="text-text ml-auto p-2 lg:hidden"
          aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
        >
          {isMobileMenuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* モバイルメニューオーバーレイ */}
      {isMobileMenuOpen && (
        <div className="bg-surface border-border absolute top-full left-0 w-full border-b shadow-lg lg:hidden">
          <div className="px-4 py-3">
            {NAV_ITEMS.map((item) => {
              if (item.items) {
                return (
                  <div key={item.dropdownKey} className="mb-2">
                    <p className="text-text-muted mb-1 px-2 text-xs font-semibold tracking-wider uppercase">
                      {item.label}
                    </p>
                    {item.items.map((sub) => (
                      <a
                        key={sub.href}
                        href={sub.href}
                        onClick={handleNavClick}
                        className="hover:bg-background text-text block rounded px-3 py-2 text-sm transition-colors"
                      >
                        {sub.label}
                      </a>
                    ))}
                  </div>
                );
              }
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className="hover:bg-background text-text mb-1 flex items-center justify-between rounded px-3 py-2 text-sm transition-colors"
                >
                  {item.label}
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="bg-danger rounded-full px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </a>
              );
            })}
            <div className="border-border my-2 border-t" />
            {USER_MENU_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className="hover:bg-background text-text block rounded px-3 py-2 text-sm transition-colors"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => {
                handleNavClick();
                window.location.href = "/auth/login";
              }}
              className="text-danger hover:bg-background w-full cursor-pointer rounded px-3 py-2 text-left text-sm transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
