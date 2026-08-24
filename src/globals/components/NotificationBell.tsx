import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, useUnreadCount } from "../../hooks/useNotifications";
import { NotificationResponse } from "../../apis/store/api/notification";

interface NotificationBellProps {
  /** Position of the dropdown relative to the bell */
  position?: "bottom-right" | "bottom-left";
  /** Maximum notifications to show in dropdown before "View All" */
  maxPreview?: number;
}

export function NotificationBell({ position = "bottom-right", maxPreview = 5 }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, isLoading, refetch } = useNotifications(0, maxPreview);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleNotificationClick = useCallback(
    async (notification: NotificationResponse) => {
      if (!notification.read) {
        await markAsRead(notification.notificationId);
      }
      // TODO: Navigate to transaction details if needed
      // For now just close the dropdown
      setIsOpen(false);
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.notificationId);
    }
    setIsOpen(false);
  }, [notifications, markAsRead]);

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
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const getNotificationIcon = (type: NotificationResponse["type"], role: NotificationResponse["role"]) => {
    if (type === "TRANSACTION_COMPLETED") {
      return role === "DEBITOR" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="8 17 12 21 16 17" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      );
    }
    if (type === "TRANSACTION_FAILED") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    }
    if (type === "TRANSACTION_REVERSED") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <polyline points="23 20 23 14 17 14" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

  return (
    <div style={s.wrapper} ref={bellRef}>
      <button
        style={s.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div style={s.bellIcon}>{getNotificationIcon("TRANSACTION_COMPLETED", "CREDITOR")}</div>
        {unreadCount > 0 && (
          <span style={s.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            ...s.dropdown,
            right: position === "bottom-right" ? 0 : "auto",
            left: position === "bottom-left" ? 0 : "auto",
          }}
          role="menu"
        >
          <div style={s.dropdownHeader}>
            <h3 style={s.dropdownTitle}>Notifications</h3>
            {unreadCount > 0 && (
              <button style={s.markAllReadBtn} onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div style={s.dropdownList}>
            {isLoading ? (
              <div style={s.loading}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={s.empty}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No notifications yet</p>
                <span>You're all caught up!</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.notificationId}
                  style={{
                    ...s.notificationItem,
                    opacity: notification.read ? 0.7 : 1,
                    background: notification.read ? "transparent" : "#1e293b",
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  role="menuitem"
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
                    </div>
                  </div>
                  {!notification.read && <div style={s.unreadDot} />}
                </button>
              ))
            )}
          </div>

          {notifications.length >= maxPreview && (
            <div style={s.dropdownFooter}>
              <button style={s.viewAllBtn} onClick={() => { setIsOpen(false); navigate("/notifications"); }}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { position: "relative" as const },
  bellButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s, border-color 0.2s",
  },
  bellIcon: { display: "flex", alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
  },
  dropdown: {
    position: "absolute" as const,
    top: "calc(100% + 8px)",
    width: 380,
    maxHeight: 480,
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    overflow: "hidden" as const,
    zIndex: 100,
    animation: "fadeIn 0.15s ease-out",
  },
  dropdownHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #1e293b",
  },
  dropdownTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  markAllReadBtn: {
    background: "transparent",
    border: "none",
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    transition: "background 0.2s",
  },
  dropdownList: { maxHeight: 400, overflowY: "auto" as const },
  loading: { padding: "24px", textAlign: "center" as const, color: "#64748b", fontSize: 14 },
  empty: {
    padding: "32px 24px",
    textAlign: "center" as const,
    color: "#64748b",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
  },
  notificationItem: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 16px",
    border: "none",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    textAlign: "left" as const,
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
  notificationTitle: { fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 },
  notificationTime: { fontSize: 11, color: "#64748b", whiteSpace: "nowrap" as const, flexShrink: 0 },
  notificationMessage: { fontSize: 12, color: "#94a3b8", lineHeight: 1.4, marginBottom: 6 },
  notificationMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
  },
  notificationAmount: { fontWeight: 600, color: "#4ade80" },
  notificationType: {
    color: "#64748b",
    textTransform: "lowercase" as const,
    fontWeight: 500,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#3b82f6",
    flexShrink: 0,
    marginTop: 4,
  },
  dropdownFooter: {
    padding: "12px 16px",
    borderTop: "1px solid #1e293b",
  },
  viewAllBtn: {
    width: "100%",
    background: "transparent",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
    padding: "10px",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
  },
};