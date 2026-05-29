import { useState } from "react";
import { Wallet } from "./data/types";
import { WALLET_META } from "./data/constants";
import { formatAmount } from "./utils/helper";
import styles from "./WalletCard.module.scss";

interface WalletCardProps {
  wallet: Wallet;
  selected: boolean;
  onClick: () => void;
}

export const WalletCard = ({ wallet, selected, onClick }: WalletCardProps) => {
  const meta = WALLET_META[wallet.walletType];
  const [balanceHidden, setBalanceHidden] = useState(false);

  const toggleBalance = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBalanceHidden((prev) => !prev);
  };

  return (
    <div
      className={`${styles.card} ${styles[meta.themeClass]} ${selected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <div className={styles.decorCircle1} />
      <div className={styles.decorCircle2} />

      <div className={styles.header}>
        <div>
          <span className={styles.emoji}>{meta.emoji}</span>
          <div className={styles.typeLabel}>{meta.label.toUpperCase()}</div>
        </div>
        <div className={`${styles.status} ${wallet.active ? styles.active : styles.inactive}`}>
          {wallet.active ? "ACTIVE" : "INACTIVE"}
        </div>
      </div>

      <div className={styles.balanceSection}>
        <div className={styles.balanceLabel}>BALANCE</div>
        <div className={styles.balanceRow}>
          <span className={styles.balanceValue}>
            {balanceHidden ? "••••••" : formatAmount(wallet.balance)}
          </span>
          <button className={styles.toggleBtn} onClick={toggleBalance} aria-label="Toggle balance visibility">
            {balanceHidden ? "👁️" : "🙈"}
          </button>
        </div>
      </div>

      {wallet.goalName && (
        <div className={styles.goalName}>
          🎯 <span>{wallet.goalName}</span>
        </div>
      )}

      <div className={styles.walletId}>{wallet.walletId.slice(0, 20)}…</div>
    </div>
  );
};