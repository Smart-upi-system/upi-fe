import { useState, useRef, useEffect } from "react";
import { WalletCard } from "./components/WalletCard";
import { TransactionRow } from "./components/TransactionRow";
import { InfoRow } from "./components/InfoRow";
import { MOCK_WALLETS, MOCK_TRANSACTIONS } from "./components/data/mockData";
import { WALLET_META } from "./components/data/constants";
import { formatAmount, formatDate } from "./components/utils/helper";
import styles from "./Wallet.module.scss";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "overview" | "transactions" | "details";

export const Wallet = ({ open, onClose }: WalletModalProps) => {
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

  const wallet = MOCK_WALLETS.find((w) => w.walletId === selectedId) ?? MOCK_WALLETS[0];
  const meta = WALLET_META[wallet.walletType];
  const totalBalance = MOCK_WALLETS.filter((w) => w.active).reduce((s, w) => s + w.balance, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "transactions", label: "Transactions" },
    { key: "details", label: "Details" },
  ];

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.title}>My Wallets</h2>
            <p className={styles.total}>
              Total · <strong>{formatAmount(totalBalance)}</strong>
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
            {MOCK_WALLETS.map((w) => (
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
                  <div className={styles.statIcon}>🔒</div>
                  <div className={styles.statValue}>v{wallet.version}</div>
                  <div className={styles.statLabel}>Version</div>
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
              {MOCK_TRANSACTIONS.slice(0, 3).map((txn) => (
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
              {MOCK_TRANSACTIONS.map((txn) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))}
            </>
          )}

          {activeTab === "details" && (
            <>
              <InfoRow label="Wallet ID" value={wallet.walletId} mono />
              <InfoRow label="User ID" value={wallet.userId} mono />
              <InfoRow label="Type" value={wallet.walletType} />
              <InfoRow label="Balance" value={formatAmount(wallet.balance)} />
              <InfoRow label="Version" value={`v${wallet.version} (optimistic lock)`} />
              <InfoRow label="Status" value={wallet.active ? "Active" : "Inactive"} />
              {wallet.goalId && <InfoRow label="Goal ID" value={wallet.goalId} mono />}
              {wallet.goalName && <InfoRow label="Goal name" value={wallet.goalName} />}
              <InfoRow label="Last updated" value={formatDate(wallet.lastUpdated)} />
              <InfoRow label="Created at" value={formatDate(wallet.createdAt)} />
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