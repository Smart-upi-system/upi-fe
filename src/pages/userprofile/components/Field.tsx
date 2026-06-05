import { type ReactNode, useRef, useEffect } from "react";
import styles from "../ProfilePage.module.scss";

interface FieldProps {
  label: string;
  id?: string;
  children: ReactNode;
  full?: boolean;
  /** When true the field is in active edit mode */
  editing?: boolean;
  /** Called when the user activates this field (clicks the read-only display) */
  onActivate?: () => void;
  /** Called when the user leaves this field (blur / outside click / Escape) */
  onDeactivate?: () => void;
  /** The plain-text value to display in read-only mode */
  displayValue?: string;
  /** When true, the field is never editable (e.g. read-only system fields) */
  readOnly?: boolean;
}

export default function Field({
  label,
  id,
  children,
  full,
  editing = false,
  onActivate,
  onDeactivate,
  displayValue,
  readOnly = false,
}: FieldProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Focus the first focusable child when entering edit mode
  useEffect(() => {
    if (editing && wrapperRef.current) {
      const focusable = wrapperRef.current.querySelector<HTMLElement>(
        "input, textarea, select"
      );
      focusable?.focus();
    }
  }, [editing]);

  // Dismiss on outside click
  useEffect(() => {
    if (!editing) return;

    function handleMouseDown(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        onDeactivate?.();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [editing, onDeactivate]);

  // Dismiss on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && editing) {
      onDeactivate?.();
    }
  }

  const isEditable = !readOnly && !!onActivate;

  return (
    <div
      ref={wrapperRef}
      className={[
        styles.field,
        full ? styles.full : "",
        isEditable ? styles.fieldEditable : "",
        editing ? styles.fieldEditing : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={handleKeyDown}
    >
      <label htmlFor={id}>{label}</label>

      {isEditable && !editing ? (
        /* ── Read-only display row ── */
        <div
          className={styles.fieldReadOnly}
          onClick={onActivate}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onActivate?.();
            }
          }}
          aria-label={`Edit ${label}`}
        >
          <span className={styles.fieldDisplayValue}>
            {displayValue ?? "—"}
          </span>
          <span className={styles.fieldPencil} aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
        </div>
      ) : (
        /* ── Active / non-editable child ── */
        children
      )}
    </div>
  );
}