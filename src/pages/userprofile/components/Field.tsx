import type { ReactNode } from "react";
import styles from "../ProfilePage.module.scss";

interface FieldProps {
  label: string;
  id?: string;
  children: ReactNode;
  full?: boolean;
}

export default function Field({
  label,
  id,
  children,
  full,
}: FieldProps) {
  return (
    <div className={`${styles.field} ${full ? styles.full : ""}`}>
      <label htmlFor={id}>{label}</label>

      {children}
    </div>
  );
}