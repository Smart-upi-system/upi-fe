import styles from "../ProfilePage.module.scss";

interface AvatarProps {
  firstName: string;
  lastName: string;
  pictureUrl: string;
}

export default function Avatar({
  firstName,
  lastName,
  pictureUrl,
}: AvatarProps) {
  const initials =
    ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase() || "U";

  return (
    <div className={styles.avatar}>
      {pictureUrl ? (
        <img
          src={pictureUrl}
          alt="Profile"
          className={styles.avatarImage}
        />
      ) : (
        initials
      )}
    </div>
  );
}