import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetTransactionHistoryQuery,
  useTransferMutation,
  useDepositMutation,
} from "../../apis/store/api/transaction";
import { useGetProfileQuery } from "../../apis/store/api/users";
import { v4 as uuidv4 } from "uuid";
import { useToast, ToastContainer, toast } from "../../globals/components/Toast";
import { NotificationBell } from "../../globals/components/NotificationBell";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalMode = "transfer" | "deposit" | null;

interface TransactionResponse {
  transactionId: string;
  senderId: string;       // internal UUID
  receiverId: string;     // internal UUID
  senderUpiId: string;
  receiverUpiId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;           // DEPOSIT | P2P_TRANSFER | CREDIT | DEBIT | TRANSFER
  remarks: string;
  metadata?: {
    senderKycVerified?: boolean;
    receiverKycVerified?: boolean;
    initiatedBy?: string;
  };
  initiatedAt: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "SUCCESS":    return "#22c55e";
    case "FAILED":     return "#ef4444";
    case "PENDING":    return "#f59e0b";
    case "CREDITING":  return "#a78bfa";
    case "DEBITING":   return "#60a5fa";
    default:           return "#94a3b8";
  }
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAmount(amount: number, type: string, tx: TransactionResponse, myUpiId?: string) {
  const t = type?.toUpperCase();

  let isDebit: boolean;
  if (t === "P2P_TRANSFER" || t === "TRANSFER") {
    // Outgoing only if I am the sender
    isDebit = !!myUpiId && tx.senderUpiId === myUpiId;
  } else {
    isDebit = t === "DEBIT";
  }

  const sign = isDebit ? "-" : "+";
  return `${sign}₹${amount?.toLocaleString("en-IN")}`;
}

/** Shortened UUID: first 8 chars */
function shortId(id: string) {
  if (!id) return "—";
  return id.substring(0, 8) + "…";
}

/** Card meta: label, counterpartyUpi, counterpartyId */
function cardMeta(tx: TransactionResponse) {
  const t = tx.type?.toUpperCase();

  if (t === "DEPOSIT") {
    return {
      label: "Self Deposit",
      fromUpi: tx.senderUpiId,
      toUpi: tx.receiverUpiId,
      fromId: tx.senderId,
      toId: tx.receiverId,
    };
  }

  if (t === "P2P_TRANSFER" || t === "TRANSFER" || t === "DEBIT") {
    return {
      label: "Transfer",
      fromUpi: tx.senderUpiId,
      toUpi: tx.receiverUpiId,
      fromId: tx.senderId,
      toId: tx.receiverId,
    };
  }

  // CREDIT / RECEIVE
  return {
    label: "Received",
    fromUpi: tx.senderUpiId,
    toUpi: tx.receiverUpiId,
    fromId: tx.senderId,
    toId: tx.receiverId,
  };
}

// ── Icons ─────────────────────────────────────────────────────────────────────

/** Deposit: wallet with arrow pointing downward into it */
const IconDeposit = ({ size = 18, color = "#4ade80" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <polyline points="9 15 12 18 15 15" />
  </svg>
);

/** P2P Transfer / send: paper plane */
const IconSend = ({ size = 18, color = "#60a5fa" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/** Credit / received: arrow coming down from above into a tray */
const IconReceive = ({ size = 18, color = "#34d399" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 17 12 21 16 17" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

/** Self-fund / top-up: circular arrows (refresh) */
const IconSelfFund = ({ size = 18, color = "#a78bfa" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

/** Debit (generic outgoing) */
const IconDebit = ({ size = 18, color = "#f87171" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 7 12 3 8 7" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

interface ChipConfig {
  bg: string;
  icon: React.ReactNode;
}

function chipConfig(type: string): ChipConfig {
  const t = type?.toUpperCase();

  if (t === "DEPOSIT")         return { bg: "#14532d", icon: <IconDeposit /> };
  if (t === "P2P_TRANSFER")    return { bg: "#1e3a5f", icon: <IconSend /> };
  if (t === "TRANSFER")        return { bg: "#1e3a5f", icon: <IconSend /> };
  if (t === "DEBIT")           return { bg: "#3b1a1a", icon: <IconDebit /> };
  if (t === "CREDIT")          return { bg: "#14532d", icon: <IconReceive /> };
  if (t === "SELF_FUND")       return { bg: "#2d1b69", icon: <IconSelfFund /> };
  // fallback
  return { bg: "#1e293b", icon: <IconReceive /> };
}

// ── Button icons ──────────────────────────────────────────────────────────────

const DepositIcon = () => <IconDeposit size={15} color="currentColor" />;
const TransferIcon = () => <IconSend size={15} color="currentColor" />;

// ── Sub-components ────────────────────────────────────────────────────────────

/** Small UPI + ID row used inside transaction cards */
function PartyRow({ label, upiId, internalId, accent }: {
  label: string;
  upiId: string;
  internalId: string;
  accent: string;
}) {
  return (
    <div style={ps.wrap}>
      <span style={{ ...ps.badge, background: accent + "22", color: accent }}>{label}</span>
      <span style={ps.upi}>{upiId || "—"}</span>
      <span style={ps.id} title={internalId}>#{shortId(internalId)}</span>
    </div>
  );
}

const ps: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap" as const,
  },
  badge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    padding: "1px 5px",
    borderRadius: 4,
  },
  upi: {
    fontSize: 13,
    fontWeight: 600,
    color: "#e2e8f0",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 160,
  },
  id: {
    fontSize: 10,
    color: "#475569",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function Transaction() {
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();

  const { data: profile } = useGetProfileQuery();

  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading, isError, refetch } = useGetTransactionHistoryQuery({ page, size: pageSize });
  const [transfer, { isLoading: transferring }] = useTransferMutation();
  const [deposit,  { isLoading: depositing  }] = useDepositMutation();

  const [modal, setModal] = useState<ModalMode>(null);

  const [receiverUpiId, setReceiverUpiId]   = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [remarks, setRemarks]               = useState("");

  const [depositAmount, setDepositAmount]   = useState("");
  const [depositDesc, setDepositDesc]       = useState("");

  async function handleTransfer() {
    if (!receiverUpiId || !transferAmount) return;
    try {
      await transfer({
        receiverUpiId,
        amount: parseFloat(transferAmount),
        remarks,
        idempotencyKey: uuidv4(),
      }).unwrap();
      showToast(toast.success("Transfer Successful", `₹${parseFloat(transferAmount).toLocaleString("en-IN")} sent to ${receiverUpiId}`));
      setModal(null);
      setReceiverUpiId(""); setTransferAmount(""); setRemarks("");
      refetch();
    } catch {
      showToast(toast.error("Transfer Failed", "Please try again."));
    }
  }

  async function handleDeposit() {
    if (!depositAmount || !profile?.upiID) return;
    try {
      await deposit({
        upiId: profile.upiID,
        amount: parseFloat(depositAmount),
        idempotencyKey: uuidv4(),
        description: depositDesc,
      }).unwrap();
      showToast(toast.success("Deposit Successful", `₹${parseFloat(depositAmount).toLocaleString("en-IN")} added to your wallet`));
      setModal(null);
      setDepositAmount(""); setDepositDesc("");
      refetch();
    } catch {
      showToast(toast.error("Deposit Failed", "Please try again."));
    }
  }

  const transactions: TransactionResponse[] = data?.transactions ?? [];

  return (
    <div style={s.page}>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.iconBtn} onClick={() => navigate("/userProfile")} aria-label="Go to profile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
          <h1 style={s.title}>Transactions</h1>
        </div>
        <div style={s.actions}>
          <NotificationBell position="bottom-right" />
          <button style={{ ...s.btn, ...s.btnDeposit }} onClick={() => setModal("deposit")}>
            <DepositIcon /> Deposit
          </button>
          <button style={{ ...s.btn, ...s.btnTransfer }} onClick={() => setModal("transfer")}>
            <TransferIcon /> Transfer
          </button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      {data && (
        <div style={s.summary}>
          <span style={s.summaryItem}>
            <span style={s.summaryLabel}>Total</span>
            <span style={s.summaryVal}>{data.totalElements}</span>
          </span>
          <span style={s.summaryDivider} />
          <span style={s.summaryItem}>
            <span style={s.summaryLabel}>Page</span>
            <span style={s.summaryVal}>{data.currentPage + 1} / {data.totalPages}</span>
          </span>
        </div>
      )}

      {/* ── Transaction list ── */}
      {isLoading && <div style={s.state}>Loading transactions…</div>}
      {isError   && <div style={{ ...s.state, color: "#ef4444" }}>Failed to load transactions.</div>}
      {!isLoading && !isError && transactions.length === 0 && (
        <div style={s.state}>No transactions yet.</div>
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <div style={s.list}>
          {transactions.map((tx) => {
            const { label, fromUpi, toUpi, fromId, toId } = cardMeta(tx);
            const { bg, icon } = chipConfig(tx.type);
            const t = tx.type?.toUpperCase();
            const myUpi = profile?.upiID;
            // Outgoing = I am the sender (for P2P/TRANSFER); DEBIT is always outgoing
            const isOutgoing =
              t === "DEBIT" ||
              ((t === "P2P_TRANSFER" || t === "TRANSFER") && !!myUpi && tx.senderUpiId === myUpi);

            return (
              <div key={tx.transactionId} style={s.row}>

                {/* Left: icon + party info */}
                <div style={s.rowLeft}>
                  <div style={{ ...s.typeChip, background: bg }}>
                    {icon}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    {/* Label + type badge */}
                    <div style={s.rowLabelRow}>
                      <span style={s.rowLabel}>{label}</span>
                      <span style={s.typePill}>{tx.type}</span>
                    </div>

                    {/* From row */}
                    <div style={{ marginTop: 5 }}>
                      <PartyRow
                        label="From"
                        upiId={fromUpi}
                        internalId={fromId}
                        accent="#60a5fa"
                      />
                    </div>

                    {/* To row */}
                    <div style={{ marginTop: 4 }}>
                      <PartyRow
                        label="To"
                        upiId={toUpi}
                        internalId={toId}
                        accent="#a78bfa"
                      />
                    </div>

                    {/* Date + remarks */}
                    <div style={s.rowDate}>{formatDate(tx.initiatedAt)}</div>
                    {tx.remarks && (
                      <div style={s.rowRemarks}>"{tx.remarks}"</div>
                    )}
                  </div>
                </div>

                {/* Right: amount + status */}
                <div style={s.rowRight}>
                  <div style={{ ...s.rowAmount, color: isOutgoing ? "#f87171" : "#4ade80" }}>
                    {formatAmount(tx.amount, tx.type, tx, profile?.upiID)}
                  </div>
                  <div style={{ ...s.statusBadge, color: statusColor(tx.status) }}>
                    {tx.status}
                  </div>
                  {tx.metadata?.initiatedBy && (
                    <div style={s.metaTag}>{tx.metadata.initiatedBy}</div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {data && data.totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={{ ...s.pageBtn, opacity: data.hasPrevious ? 1 : 0.3 }}
            disabled={!data.hasPrevious}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span style={s.pageInfo}>{data.currentPage + 1} / {data.totalPages}</span>
          <button
            style={{ ...s.pageBtn, opacity: data.hasNext ? 1 : 0.3 }}
            disabled={!data.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Transfer Modal ── */}
      {modal === "transfer" && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={{ ...s.modalIconWrap, background: "#1e3a5f" }}>
                <TransferIcon />
              </div>
              <h2 style={s.modalTitle}>Transfer Money</h2>
            </div>

            <label style={s.label}>From</label>
            <div style={s.readonlyField}>{profile?.upiID ?? "Loading…"}</div>

            <label style={s.label}>To (Receiver UPI ID)</label>
            <input
              style={s.input}
              placeholder="e.g. friend@uws"
              value={receiverUpiId}
              onChange={(e) => setReceiverUpiId(e.target.value)}
            />
            <label style={s.label}>Amount (₹)</label>
            <input
              style={s.input}
              type="number"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
            <label style={s.label}>Remarks (optional)</label>
            <input
              style={s.input}
              placeholder="e.g. Dinner split"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div style={s.modalActions}>
              <button style={{ ...s.btn, ...s.btnCancel }} onClick={() => setModal(null)}>Cancel</button>
              <button style={{ ...s.btn, ...s.btnTransfer }} onClick={handleTransfer} disabled={transferring}>
                {transferring ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deposit Modal ── */}
      {modal === "deposit" && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={{ ...s.modalIconWrap, background: "#14532d" }}>
                <DepositIcon />
              </div>
              <h2 style={s.modalTitle}>Deposit Money</h2>
            </div>

            <label style={s.label}>Depositing to</label>
            <div style={s.readonlyField}>{profile?.upiID ?? "Loading…"}</div>

            <label style={s.label}>Amount (₹)</label>
            <input
              style={s.input}
              type="number"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <label style={s.label}>Description (optional)</label>
            <input
              style={s.input}
              placeholder="e.g. Top up"
              value={depositDesc}
              onChange={(e) => setDepositDesc(e.target.value)}
            />
            <div style={s.modalActions}>
              <button style={{ ...s.btn, ...s.btnCancel }} onClick={() => setModal(null)}>Cancel</button>
              <button
                style={{ ...s.btn, ...s.btnDeposit }}
                onClick={handleDeposit}
                disabled={depositing || !profile?.upiID}
              >
                {depositing ? "Depositing…" : "Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1a",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    padding: "24px 16px",
    maxWidth: 640,
    margin: "0 auto",
    position: "relative",
  },
  toast: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    zIndex: 1000,
    pointerEvents: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  iconBtn: {
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
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" },
  actions: { display: "flex", gap: 8 },
  btn: {
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  btnTransfer: { background: "#3b82f6", color: "#fff" },
  btnDeposit:  { background: "#16a34a", color: "#fff" },
  btnCancel:   { background: "#334155", color: "#cbd5e1" },
  summary: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "10px 16px",
    marginBottom: 16,
    fontSize: 13,
  },
  summaryItem:    { display: "flex", flexDirection: "column" as const, gap: 2 },
  summaryLabel:   { color: "#64748b", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 1 },
  summaryVal:     { color: "#f1f5f9", fontWeight: 700, fontSize: 16 },
  summaryDivider: { width: 1, height: 28, background: "#1e293b" },
  state: { textAlign: "center" as const, color: "#64748b", padding: "48px 0", fontSize: 15 },
  list: { display: "flex", flexDirection: "column" as const, gap: 8 },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "14px 16px",
    gap: 12,
  },
  rowLeft: { display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1 },
  typeChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  rowLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  rowLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  typePill: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    background: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: 4,
    padding: "1px 5px",
  },
  rowDate:    { fontSize: 11, color: "#64748b", marginTop: 5 },
  rowRemarks: { fontSize: 11, color: "#475569", marginTop: 2, fontStyle: "italic" },
  rowRight: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  rowAmount:   { fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  statusBadge: { fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const },
  metaTag:     { fontSize: 9, color: "#475569", letterSpacing: 0.3, textTransform: "uppercase" as const },
  pagination:  { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 },
  pageBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  pageInfo: { fontSize: 13, color: "#64748b" },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: "28px 24px",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  modalHeader:  { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  modalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  label: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    marginBottom: -4,
  },
  readonlyField: {
    background: "#0a0f1a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    color: "#64748b",
    fontSize: 14,
    padding: "10px 12px",
    fontFamily: "monospace",
  },
  input: {
    background: "#0a0f1a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    padding: "10px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  modalActions: { display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" },
};