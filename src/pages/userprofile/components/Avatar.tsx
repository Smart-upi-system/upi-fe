import { useRef } from "react";
import styles from "../ProfilePage.module.scss";

interface AvatarProps {
  firstName: string;
  lastName: string;
  pictureUrl: string;
  onPictureChange?: (dataUrl: string) => void;
}

export default function Avatar({
  firstName,
  lastName,
  pictureUrl,
  onPictureChange,
}: AvatarProps) {
  const initials =
    ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase() || "U";

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    onPictureChange?.(objectUrl);
    // reset so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div
      className={`${styles.avatar} ${onPictureChange ? styles.avatarEditable : ""}`}
      onClick={() => onPictureChange && fileInputRef.current?.click()}
      role={onPictureChange ? "button" : undefined}
      aria-label={onPictureChange ? "Change profile picture" : undefined}
      tabIndex={onPictureChange ? 0 : undefined}
      onKeyDown={(e) => {
        if (onPictureChange && (e.key === "Enter" || e.key === " ")) {
          fileInputRef.current?.click();
        }
      }}
    >
      {pictureUrl ? (
        <img src={pictureUrl} alt="Profile" className={styles.avatarImage} />
      ) : (
        initials
      )}

      {onPictureChange && (
        <div className={styles.avatarOverlay} aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.avatarFileInput}
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}