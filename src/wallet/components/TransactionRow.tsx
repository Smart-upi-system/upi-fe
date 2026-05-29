import { Transaction } from "./data/types";
import { formatAmount, formatDateShort } from "./utils/helper";
import styles from "./TransactionRow.module.scss";

interface TransactionRowProps {
  txn: Transaction;
}

export const TransactionRow = ({ txn }: TransactionRowProps) => {
  const isCredit = txn.type === "CREDIT";

  return (
    <div className={styles.row}>
      <div className={`${styles.icon} ${isCredit ? styles.creditIcon : styles.debitIcon}`}>
        {isCredit ? "↓" : "↑"}
      </div>
      <div className={styles.details}>
        <div className={styles.description}>{txn.description}</div>
        <div className={styles.date}>{formatDateShort(txn.timestamp)}</div>
      </div>
      <div className={`${styles.amount} ${isCredit ? styles.creditAmount : styles.debitAmount}`}>
        {isCredit ? "+" : "−"}
        {formatAmount(txn.amount)}
      </div>
    </div>
  );
};