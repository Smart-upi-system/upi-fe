import { useState, useRef, useEffect } from "react";
import { WalletCard } from "./components/WalletCard";
import { TransactionRow } from "./components/TransactionRow";
import { MOCK_WALLETS, MOCK_TRANSACTIONS } from "./components/data/mockData";
import { WALLET_META } from "./components/data/constants";
import { formatAmount } from "./components/utils/helper";
import { useGetWalletsQuery } from "../apis/store/api/wallet";
import { useGetTransactionHistoryQuery } from "../apis/store/api/transaction";
import styles from "./Wallet.module.scss";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "overview" | "transactions";

export const Wallet = ({ open, onClose }: WalletModalProps) => {
  const { data: remoteWallets, isLoading, isError, refetch } = useGetWalletsQuery(undefined, { skip: !open });
  const { data: transactionHistory, isLoading: transactionsLoading } = useGetTransactionHistoryQuery({ page: 0, size: 20 }, { skip: !open });
  const transactions = transactionHistory?.transactions?.map((t) => ({
    id: t.transactionId,
    type: (t.type?.includes("DEBIT") ? "DEBIT" : "CREDIT") as "CREDIT" | "DEBIT",
    amount: Number(t.amount),
    description: `${t.type || "Transaction"} · ${t.status}`,
    timestamp: t.initiatedAt || t.createdAt,
  })) ?? [];
  const displayWallets = remoteWallets?.map((w) => ({ ...w, balance: Number(w.balance) })) ?? MOCK_WALLETS;
  const [selectedId, setSelectedId] = useState(MOCK_WALLETS[0].walletId);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5); // small threshold
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      checkScrollButtons();
      el.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);
      return () => {
        el.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
  }, [open]);

  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = 280; // approx card width + gap
    const newScrollLeft = direction === "left"
      ? el.scrollLeft - scrollAmount
      : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  if (!open) return null;

  const wallet = displayWallets.find((w) => w.walletId === selectedId) ?? displayWallets[0];
  if (!wallet) return null;
  const meta = WALLET_META[wallet.walletType];
  const totalBalance = displayWallets.filter((w) => w.active).reduce((s, w) => s + w.balance, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "transactions", label: "Transactions" },
  ];

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.title}>My Wallets</h2>
            <p className={styles.total}>
              Total · <strong>{isLoading ? "Loading…" : formatAmount(totalBalance)}</strong>
              {isError && <button className={styles.viewAllBtn} onClick={() => refetch()}>Retry</button>}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Carousel with arrows */}
        <div className={styles.carouselWrapper}>
          {showLeftArrow && (
            <button
              className={`${styles.arrow} ${styles.leftArrow}`}
              onClick={() => scroll("left")}
              aria-label="Scroll left"
            >
              ‹
            </button>
          )}
          <div className={styles.carousel} ref={carouselRef}>
            {displayWallets.map((w) => (
              <WalletCard
                key={w.walletId}
                wallet={w}
                selected={w.walletId === selectedId}
                onClick={() => {
                  setSelectedId(w.walletId);
                  setActiveTab("overview");
                }}
              />
            ))}
          </div>
          {showRightArrow && (
            <button
              className={`${styles.arrow} ${styles.rightArrow}`}
              onClick={() => scroll("right")}
              aria-label="Scroll right"
            >
              ›
            </button>
          )}
        </div>

        <div className={styles.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === "overview" && (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>💰</div>
                  <div className={styles.statValue}>{formatAmount(wallet.balance)}</div>
                  <div className={styles.statLabel}>Balance</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>{meta.emoji}</div>
                  <div className={styles.statValue}>{wallet.walletType}</div>
                  <div className={styles.statLabel}>Type</div>
                </div>
              </div>

              {wallet.walletType === "GOAL" && wallet.goalName && (
                <div className={styles.goalCard}>
                  <div className={styles.goalHeader}>
                    <span>🎯 {wallet.goalName}</span>
                    <span>Goal ID: {wallet.goalId}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: "54%" }} />
                  </div>
                  <div className={styles.goalStats}>
                    54% towards goal · {formatAmount(wallet.balance)} saved
                  </div>
                </div>
              )}

              <div className={styles.recentHeader}>
                <span className={styles.recentLabel}>Recent activity</span>
                <button className={styles.viewAllBtn} onClick={() => setActiveTab("transactions")}>
                  View all →
                </button>
              </div>
              {(transactions.length ? transactions : MOCK_TRANSACTIONS).slice(0, 3).map((txn) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))}
            </>
          )}

          {activeTab === "transactions" && (
            <>
              <div className={styles.filterRow}>
                {["All", "Credits", "Debits"].map((f) => (
                  <button key={f} className={styles.filterBtn}>
                    {f}
                  </button>
                ))}
              </div>
              {transactionsLoading && <div>Loading transactions…</div>}
              {(transactions.length ? transactions : MOCK_TRANSACTIONS).map((txn) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))}
            </>
          )}

        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn}>↑ Add money</button>
          <button className={styles.primaryBtn}>↗ Transfer</button>
        </div>
      </div>
    </>
  );
};
