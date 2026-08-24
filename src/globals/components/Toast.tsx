import { useState, useEffect, useCallback } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div style={s.container} role="region" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  };

  const colors = {
    success: { bg: "#14532d", border: "#22c55e", text: "#86efac", icon: "#22c55e" },
    error: { bg: "#7f1d1d", border: "#ef4444", text: "#fca5a5", icon: "#ef4444" },
    info: { bg: "#1e3a5f", border: "#3b82f6", text: "#93c5fd", icon: "#3b82f6" },
    warning: { bg: "#78350f", border: "#f59e0b", text: "#fcd34d", icon: "#f59e0b" },
  };

  const c = colors[toast.type];
  const icon = icons[toast.type];

  return (
    <div
      style={{
        ...s.toast,
        background: c.bg,
        borderColor: c.border,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={{ ...s.icon, color: c.icon }}>{icon}</div>
      <div style={{ ...s.content, flex: 1 }}>
        <div style={{ ...s.title, color: c.text }}>{toast.title}</div>
        <div style={{ ...s.message, color: c.text }}>{toast.message}</div>
      </div>
      <button style={s.dismiss} onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    maxWidth: 380,
  },
  toast: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
    backdropFilter: "blur(8px)",
  },
  icon: { flexShrink: 0, marginTop: 2 },
  content: { display: "flex", flexDirection: "column" as const, gap: 4, minWidth: 0 },
  title: { fontSize: 14, fontWeight: 600, lineHeight: 1.3 },
  message: { fontSize: 13, lineHeight: 1.4, opacity: 0.9 },
  dismiss: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: 6,
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "inherit",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
    transition: "opacity 0.2s",
  },
};

// ── Hook for managing toasts ────────────────────────────────────────────────

interface UseToastReturn {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
}

let toastId = 0;

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `toast-${++toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

// ── Convenience helpers ──────────────────────────────────────────────────────

export const toast = {
  success: (title: string, message: string, duration?: number) => ({
    type: "success" as const,
    title,
    message,
    duration,
  }),
  error: (title: string, message: string, duration?: number) => ({
    type: "error" as const,
    title,
    message,
    duration,
  }),
  info: (title: string, message: string, duration?: number) => ({
    type: "info" as const,
    title,
    message,
    duration,
  }),
  warning: (title: string, message: string, duration?: number) => ({
    type: "warning" as const,
    title,
    message,
    duration,
  }),
};