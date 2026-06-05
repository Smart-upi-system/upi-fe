import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent } from "react";
import Avatar from "./components/Avatar";
import KycBadge from "./components/KycBadge";
import SectionCard from "./components/SectionCard";
import Field from "./components/Field";
import { Wallet } from "../../wallet/Wallet";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdateKycMutation,
} from "../../api/usersApi";
import styles from "./ProfilePage.module.scss";

type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  upiID: string;
  phone: string;
  kycStatus: KycStatus;
  kycDocumentUrl: string;
  profilePictureUrl: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  walletId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Seed / fallback data ──────────────────────────────────────────────────────

const INITIAL_PROFILE: UserProfile = {
  id: "prf_8b3e1f09",
  userId: "usr_d4f7a2c1",
  firstName: "Arjun",
  lastName: "Rao",
  upiID: "arjun.rao@uws",
  phone: "+91 98765 43210",
  kycStatus: "PENDING",
  kycDocumentUrl: "https://cdn.example.com/kyc/arjun_rao_id.pdf",
  profilePictureUrl: "",
  address: "12, Koregaon Park Annexe, Lane 7",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411036",
  walletId: "wlt_9f3c2a1b-4d7e-4891-b663-52dc7a08ef14",
  active: true,
  createdAt: "2024-11-03T09:41:00",
  updatedAt: "2025-05-22T14:07:00",
};

// ── Profile fields that go to /users/update-profile ──────────────────────────
type ProfileField = "firstName" | "lastName" | "phone" | "profilePictureUrl" | "address" | "city" | "state" | "pincode";
// ── KYC fields that go to /users/update-kyc ───────────────────────────────────
type KycField = "kycStatus" | "kycDocumentUrl";

const PROFILE_FIELDS = new Set<string>([
  "firstName", "lastName", "phone", "profilePictureUrl",
  "address", "city", "state", "pincode",
]);
const KYC_FIELDS = new Set<string>(["kycStatus", "kycDocumentUrl"]);

// ── Main component ────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  // ── Remote data ──
  const { data: remoteProfile } = useGetProfileQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [updateKyc] = useUpdateKycMutation();

  // ── Local state ──
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [activeField, setActiveField] = useState<keyof UserProfile | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [qrDropdownOpen, setQrDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync remote data into local state once loaded
  useEffect(() => {
    if (remoteProfile) {
      setProfile((prev) => ({ ...prev, ...remoteProfile }));
    }
  }, [remoteProfile]);

  // Close QR dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setQrDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Field helpers ─────────────────────────────────────────────────────────

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function handleText(key: keyof UserProfile) {
    return (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => update(key, e.target.value as UserProfile[typeof key]);
  }

  /**
   * Called when a field is deactivated (blur / outside click / Escape).
   * Fires the appropriate API mutation for the changed field.
   */
  const handleDeactivate = useCallback(
    async (field: keyof UserProfile) => {
      setActiveField(null);

      if (PROFILE_FIELDS.has(field)) {
        try {
          await updateProfile({
            [field]: profile[field],
          } as Record<ProfileField, string>).unwrap();
        } catch (err) {
          console.error("Failed to update profile:", err);
        }
      } else if (KYC_FIELDS.has(field)) {
        try {
          await updateKyc({
            [field]: profile[field],
          } as Record<KycField, string>).unwrap();
        } catch (err) {
          console.error("Failed to update KYC:", err);
        }
      }
    },
    [profile, updateProfile, updateKyc]
  );

  // ── Avatar upload ─────────────────────────────────────────────────────────

  async function handlePictureChange(objectUrl: string) {
    update("profilePictureUrl", objectUrl);
    try {
      await updateProfile({ profilePictureUrl: objectUrl }).unwrap();
    } catch (err) {
      console.error("Failed to update picture:", err);
    }
  }

  // ── Misc helpers ──────────────────────────────────────────────────────────

  const displayName =
    `${profile.firstName} ${profile.lastName}`.trim() || "User";

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  // Convenience: props for a click-to-edit field
  function editProps(key: keyof UserProfile) {
    return {
      editing: activeField === key,
      onActivate: () => setActiveField(key),
      onDeactivate: () => handleDeactivate(key),
      displayValue: String(profile[key] ?? ""),
    };
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.profilePage}>
      {/* ── Header ── */}
      <div className={styles.profileHeader}>
        <Avatar
          firstName={profile.firstName}
          lastName={profile.lastName}
          pictureUrl={profile.profilePictureUrl}
          onPictureChange={handlePictureChange}
        />

        <div>
          <h1>{displayName}</h1>
          <p className={styles.upiId}>{profile.upiID}</p>
          <KycBadge status={profile.kycStatus} />
        </div>

        <button
          className={styles.walletButton}
          onClick={() => setWalletOpen(true)}
        >
          💼 View Wallets
        </button>

        <div className={styles.walletButtonWrapper} ref={dropdownRef}>
          <button
            className={styles.walletButton}
            onClick={() => setQrDropdownOpen(!qrDropdownOpen)}
          >
            View QR
          </button>
          {qrDropdownOpen && (
            <div className={styles.qrDropdown}>
              <div className={styles.qrCode}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${encodeURIComponent(profile.upiID)}&pn=${encodeURIComponent(displayName)}&am=0&cu=INR`}
                  alt="UPI QR Code"
                  width="120"
                  height="120"
                />
                <p className={styles.qrText}>Scan to pay</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Personal info ── */}
      <SectionCard icon="👤" title="Personal info">
        <div className={styles.grid}>
          <Field label="First name" id="firstName" {...editProps("firstName")}>
            <input
              id="firstName"
              type="text"
              className={styles.input}
              value={profile.firstName}
              onChange={handleText("firstName")}
            />
          </Field>

          <Field label="Last name" id="lastName" {...editProps("lastName")}>
            <input
              id="lastName"
              type="text"
              className={styles.input}
              value={profile.lastName}
              onChange={handleText("lastName")}
            />
          </Field>

          <Field label="Phone" id="phone" {...editProps("phone")}>
            <input
              id="phone"
              type="tel"
              className={styles.input}
              value={profile.phone}
              onChange={handleText("phone")}
            />
          </Field>

          <Field label="Account status">
            <div className={styles.statusRow}>
              <div
                className={`${styles.statusDot} ${
                  profile.active ? styles.active : styles.inactive
                }`}
              />
              <span>{profile.active ? "Active" : "Inactive"}</span>
              <input
                type="checkbox"
                checked={profile.active}
                onChange={(e) => update("active", e.target.checked)}
              />
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* ── UPI & wallet ── */}
      <SectionCard icon="📱" title="UPI & wallet">
        <div className={styles.grid}>
          <Field label="UPI ID" full readOnly>
            <input
              type="text"
              className={`${styles.input} ${styles.mono}`}
              value={profile.upiID}
              readOnly
            />
          </Field>

          <Field label="Wallet ID" full readOnly>
            <div className={styles.walletBox}>🪙 {profile.walletId}</div>
          </Field>
        </div>
      </SectionCard>

      {/* ── Address ── */}
      <SectionCard icon="📍" title="Address">
        <div className={styles.grid}>
          <Field label="Street address" full {...editProps("address")}>
            <textarea
              rows={2}
              className={styles.input}
              value={profile.address}
              onChange={handleText("address")}
            />
          </Field>

          <Field label="City" id="city" {...editProps("city")}>
            <input
              id="city"
              type="text"
              className={styles.input}
              value={profile.city}
              onChange={handleText("city")}
            />
          </Field>

          <Field label="State" id="state" {...editProps("state")}>
            <input
              id="state"
              type="text"
              className={styles.input}
              value={profile.state}
              onChange={handleText("state")}
            />
          </Field>

          <Field label="Pincode" id="pincode" {...editProps("pincode")}>
            <input
              id="pincode"
              type="text"
              className={styles.input}
              value={profile.pincode}
              onChange={handleText("pincode")}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── KYC verification ── */}
      <SectionCard icon="🛡️" title="KYC verification">
        <div className={styles.grid}>
          <Field
            label="KYC status"
            id="kycStatus"
            {...editProps("kycStatus")}
            displayValue={profile.kycStatus}
          >
            <select
              id="kycStatus"
              className={styles.input}
              value={profile.kycStatus}
              onChange={(e) => {
                update("kycStatus", e.target.value as KycStatus);
              }}
              onBlur={() => handleDeactivate("kycStatus")}
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </Field>

          <Field
            label="KYC document URL"
            id="kycDocumentUrl"
            {...editProps("kycDocumentUrl")}
          >
            <input
              id="kycDocumentUrl"
              type="url"
              className={styles.input}
              value={profile.kycDocumentUrl}
              onChange={handleText("kycDocumentUrl")}
            />
          </Field>

          <Field
            label="Profile picture URL"
            id="profilePictureUrl"
            {...editProps("profilePictureUrl")}
          >
            <input
              id="profilePictureUrl"
              type="url"
              className={styles.input}
              value={profile.profilePictureUrl}
              onChange={handleText("profilePictureUrl")}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── System info ── */}
      <SectionCard icon="ℹ️" title="System info" muted>
        <div className={styles.systemGrid}>
          {[
            { label: "Profile ID", value: profile.id },
            { label: "User ID", value: profile.userId },
            { label: "Created at", value: formatDateTime(profile.createdAt) },
            { label: "Updated at", value: formatDateTime(profile.updatedAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className={styles.systemLabel}>{label}</span>
              <span className={styles.systemValue}>{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Wallet Modal */}
      <Wallet open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}