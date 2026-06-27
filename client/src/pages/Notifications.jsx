import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiBell,
  FiInfo,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiAlertTriangle,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";

import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../features/notifications/notificationsSlice";

// Icon + accent colour per notification type.
const TYPE_META = {
  info: { icon: FiInfo, tone: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20" },
  success: {
    icon: FiCheckCircle,
    tone: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  reminder: {
    icon: FiClock,
    tone: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  achievement: {
    icon: FiAward,
    tone: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  warning: {
    icon: FiAlertTriangle,
    tone: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
};

const relativeTime = (date) => {
  const then = new Date(date).getTime();
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(date).toLocaleDateString();
};

const Notifications = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const handleClick = (n) => {
    if (!n.read) dispatch(markNotificationRead(n._id));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }.`
              : "You're all caught up."}
          </p>
        </div>

        <button
          onClick={() => dispatch(markAllNotificationsRead())}
          disabled={unreadCount === 0}
          className="btn-ghost border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
        >
          <FiCheck /> Mark all read
        </button>
      </div>

      {/* List */}
      {status === "loading" && items.length === 0 ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            const Icon = meta.icon;
            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 shadow-sm transition ${
                  n.read
                    ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    : "border-l-4 border-l-brand-600 border-slate-200 bg-brand-50/60 dark:border-slate-700 dark:bg-brand-900/10"
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.bg} ${meta.tone}`}
                >
                  <Icon className="text-lg" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {n.title}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      {n.body}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(deleteNotification(n._id));
                  }}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-700"
                  title="Delete notification"
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const LoadingState = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-800">
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-900/30">
      <FiBell className="text-3xl" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
      No notifications yet
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
      Reminders, achievements and updates will show up here.
    </p>
  </div>
);

export default Notifications;