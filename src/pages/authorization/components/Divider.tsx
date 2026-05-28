import styles from '../login.module.scss';

export function Divider() {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerLine} />
      <span>or</span>
      <div className={styles.dividerLine} />
    </div>
  );
}