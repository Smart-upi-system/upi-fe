import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationResponse } from "../../apis/store/api/notification";
import { useToast, ToastContainer, toast } from "../../globals/components/Toast";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    refetch,
    markAsRead,
    totalPages,
    currentPage,
    hasNext,
    hasPrevious,
  } = useNotifications(page, pageSize);

  const handleNotificationClick = useCallback(
    async (notification: NotificationResponse) => {
      if (!notification.read) {
        try {
          await markAsRead(notification.notificationId);
        } catch {
          showToast(toast.error("Failed", "Could not mark as read"));
        }
      }
      // Navigate to transaction details if needed
      // navigate(`/transaction/${notification.transactionId}`);
    },
    [markAsRead, showToast]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    for (const notification of unreadNotifications) {
      try {
        await markAsRead(notification.notificationId);
      } catch {
        showToast(toast.error("Failed", `Could not mark ${notification.notificationId} as read`));
      }
    }
    showToast(toast.success("All read", "All notifications marked as read"));
  }, [notifications, markAsRead, showToast]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getNotificationIcon = (type: NotificationResponse["type"], role: NotificationResponse["role"]) => {
    if (type === "TRANSACTION_COMPLETED") {
      return role === "DEBITOR" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="8 17 12 21 16 17" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      );
    }
    if (type === "TRANSACTION_FAILED") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    }
    if (type === "TRANSACTION_REVERSED") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <polyline points="23 20 23 14 17 14" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    }
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  };

  const getNotificationColor = (type: NotificationResponse["type"], role: NotificationResponse["role"]) => {
    if (type === "TRANSACTION_COMPLETED") {
      return role === "DEBITOR" ? "#60a5fa" : "#34d399";
    }
    if (type === "TRANSACTION_FAILED") return "#ef4444";
    if (type === "TRANSACTION_REVERSED") return "#f59e0b";
    return "#94a3b8";
  };

  const handleBack = () => navigate(-1);

  return (
    <div style={s.page}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── Header ── */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={handleBack} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div style={s.headerCenter}>
          <h1 style={s.title}>Notifications</h1>
          {unreadCount > 0 && (
            <span style={s.unreadBadge}>{unreadCount} unread</span>
          )}
        </div>
        <div style={s.headerRight}>
          {unreadCount > 0 && (
            <button style={s.markAllBtn} onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* ── Notification List ── */}
      {isLoading && <div style={s.loading}>Loading notifications…</div>}
      {isError && <div style={s.error}>Failed to load notifications.</div>}
      {!isLoading && !isError && notifications.length === 0 && (
        <div style={s.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p>No notifications yet</p>
          <span>You're all caught up!</span>
        </div>
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <div style={s.list}>
          {notifications.map((notification) => (
            <button
              key={notification.notificationId}
              style={{
                ...s.notificationItem,
                opacity: notification.read ? 0.7 : 1,
                background: notification.read ? "transparent" : "#1e293b",
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <div
                style={{
                  ...s.notificationIcon,
                  color: getNotificationColor(notification.type, notification.role),
                }}
              >
                {getNotificationIcon(notification.type, notification.role)}
              </div>
              <div style={s.notificationContent}>
                <div style={s.notificationTitleRow}>
                  <span style={s.notificationTitle}>{notification.title}</span>
                  <span style={s.notificationTime}>{formatTimeAgo(notification.createdAt)}</span>
                </div>
                <div style={s.notificationMessage}>{notification.message}</div>
                <div style={s.notificationMeta}>
                  <span style={s.notificationAmount}>
                    {notification.amount >= 0 ? "+" : ""}₹{Math.abs(notification.amount).toLocaleString("en-IN")}
                  </span>
                  <span style={s.notificationType}>{notification.type.replace(/_/g, " ")}</span>
                  <span style={s.notificationRole}>{notification.role}</span>
                </div>
              </div>
              {!notification.read && <div style={s.unreadDot} />}
            </button>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={{ ...s.pageBtn, opacity: hasPrevious ? 1 : 0.3 }}
            disabled={!hasPrevious}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span style={s.pageInfo}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            style={{ ...s.pageBtn, opacity: hasNext ? 1 : 0.3 }}
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1a",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    padding: "24px 16px",
    maxWidth: 640,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#94a3b8",
    cursor: "pointer",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    lineHeight: 1,
  },
  headerCenter: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" },
  unreadBadge: {
    fontSize: 11,
    color: "#3b82f6",
    fontWeight: 600,
    background: "#1e3a5f",
    padding: "2px 8px",
    borderRadius: 10,
  },
  headerRight: { display: "flex", alignItems: "center" },
  markAllBtn: {
    background: "transparent",
    border: "1px solid #3b82f6",
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: 6,
    transition: "background 0.2s, color 0.2s",
  },
  loading: { textAlign: "center" as const, color: "#64748b", padding: "48px 0", fontSize: 15 },
  error: { textAlign: "center" as const, color: "#ef4444", padding: "48px 0", fontSize: 15 },
  empty: {
    padding: "64px 24px",
    textAlign: "center" as const,
    color: "#64748b",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
  },
  list: { display: "flex", flexDirection: "column" as const, gap: 8 },
  notificationItem: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
    border: "none",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    textAlign: "left" as const,
    borderRadius: 12,
    border: "1px solid #1e293b",
    transition: "background 0.15s",
  },
  notificationIcon: { flexShrink: 0, marginTop: 2 },
  notificationContent: { flex: 1, minWidth: 0 },
  notificationTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: { fontSize: 14, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 },
  notificationTime: { fontSize: 12, color: "#64748b", whiteSpace: "nowrap" as const, flexShrink: 0 },
  notificationMessage: { fontSize: 13, color: "#94a3b8", lineHeight: 1.4, marginBottom: 6 },
  notificationMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    flexWrap: "wrap" as const,
  },
  notificationAmount: { fontWeight: 600, color: "#4ade80" },
  notificationType: {
    color: "#64748b",
    textTransform: "lowercase" as const,
    fontWeight: 500,
    background: "#1e293b",
    padding: "2px 6px",
    borderRadius: 4,
  },
  notificationRole: {
    color: "#64748b",
    textTransform: "lowercase" as const,
    fontWeight: 500,
    background: "#1e293b",
    padding: "2px 6px",
    borderRadius: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#3b82f6",
    flexShrink: 0,
    marginTop: 4,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1px solid #1e293b",
  },
  pageBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
  },
  pageInfo: { fontSize: 13, color: "#64748b" },
};