import type { ReactNode } from "react";
import styles from "../ProfilePage.module.scss";

interface SectionCardProps {
  icon: string;
  title: string;
  muted?: boolean;
  children: ReactNode;
}

export default function SectionCard({
  icon,
  title,
  muted,
  children,
}: SectionCardProps) {
  return (
    <div className={`${styles.sectionCard} ${muted ? styles.muted : ""}`}>
      <div className={styles.sectionHeader}>
        <span>{icon}</span>

        <span className={styles.sectionTitle}>{title}</span>
      </div>

      {children}
    </div>
  );
}