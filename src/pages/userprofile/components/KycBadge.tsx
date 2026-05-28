import styles from "../ProfilePage.module.scss";

type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface Props {
  status: KycStatus;
}

export default function KycBadge({ status }: Props) {
  const config: Record<KycStatus, { label: string; className: string }> = {
    PENDING: {
      label: "KYC Pending",
      className: `${styles.kycBadge} ${styles.pending}`,
    },
    VERIFIED: {
      label: "KYC Verified",
      className: `${styles.kycBadge} ${styles.verified}`,
    },
    REJECTED: {
      label: "KYC Rejected",
      className: `${styles.kycBadge} ${styles.rejected}`,
    },
  };

  const { label, className } = config[status];

  return <span className={className}>{label}</span>;
}