import { useNotificationStore } from "../../store/notificationStore";
import { BellIcon, ChevronRightIcon } from "../ui/Icons";

export function NotificationSnippet() {
  const notifications = useNotificationStore((s) => s.notifications);

  const latest = notifications
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-text flex items-center gap-2 text-base font-semibold">
          <BellIcon className="text-primary h-5 w-5" />
          お知らせ
        </h2>
        <a
          href="/notifications"
          className="text-primary hover:text-primary-hover flex items-center gap-0.5 text-sm font-medium transition-colors"
        >
          すべて見る
          <ChevronRightIcon className="h-4 w-4" />
        </a>
      </div>

      {latest.length === 0 ? (
        <p className="text-text-muted text-sm">お知らせはありません</p>
      ) : (
        <ul className="divide-border divide-y">
          {latest.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-border" : "bg-primary"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-text truncate text-sm font-medium">
                  {n.title}
                </p>
                <p className="text-text-muted mt-0.5 truncate text-xs">
                  {n.body}
                </p>
              </div>
              <time className="text-text-muted shrink-0 text-xs">
                {new Date(n.createdAt).toLocaleDateString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
