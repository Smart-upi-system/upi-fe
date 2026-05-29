import styles from "./InfoRow.module.scss";

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

export const InfoRow = ({ label, value, mono }: InfoRowProps) => {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${mono ? styles.mono : ""}`}>{value}</span>
    </div>
  );
};