import { useState,useEffect,useRef  } from "react";
import type { ChangeEvent } from "react";
import Avatar from "./components/Avatar";
import KycBadge from "./components/KycBadge";
import SectionCard from "./components/SectionCard";
import Field from "./components/Field";
import { Wallet } from "../../wallet/Wallet";            // <-- import Wallet modal
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

// ── Seed data ────────────────────────────────────────────────────────────────

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

  
// ── Main component ───────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [saved, setSaved] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);   // <-- modal state
  const [qrDropdownOpen, setQrDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof UserProfile>(
    key: K,
    value: UserProfile[K]
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleText(key: keyof UserProfile) {
    return (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => update(key, e.target.value as UserProfile[typeof key]);
  }

  function handleSave() {
    console.log("Saving profile:", profile);
    setSaved(true);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setQrDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const displayName =
    `${profile.firstName} ${profile.lastName}`.trim() || "User";

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <Avatar
          firstName={profile.firstName}
          lastName={profile.lastName}
          pictureUrl={profile.profilePictureUrl}
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

        {/* Wallet button */}
        <div className={styles.walletButtonWrapper} ref={dropdownRef}>
          <button
            className={styles.walletButton}
            onClick={() => setQrDropdownOpen(!qrDropdownOpen)}
          >
            View Qr
          </button>
          {qrDropdownOpen && (
            <div className={styles.qrDropdown}>
              <div className={styles.qrCode}>
                {/* Example QR code – replace with real UPI/link */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=arjun.rao@uws&pn=Arjun%20Rao&am=0&cu=INR"
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

      <SectionCard icon="👤" title="Personal info">
        <div className={styles.grid}>
          <Field label="First name" id="firstName">
            <input
              id="firstName"
              type="text"
              className={styles.input}
              value={profile.firstName}
              onChange={handleText("firstName")}
            />
          </Field>

          <Field label="Last name" id="lastName">
            <input
              id="lastName"
              type="text"
              className={styles.input}
              value={profile.lastName}
              onChange={handleText("lastName")}
            />
          </Field>

          <Field label="Phone" id="phone">
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

      <SectionCard icon="📱" title="UPI & wallet">
        <div className={styles.grid}>
          <Field label="UPI ID" full>
            <input
              type="text"
              className={`${styles.input} ${styles.mono}`}
              value={profile.upiID}
              readOnly
            />
          </Field>

          <Field label="Wallet ID" full>
            <div className={styles.walletBox}>
              🪙 {profile.walletId}
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon="📍" title="Address">
        <div className={styles.grid}>
          <Field label="Street address" full>
            <textarea
              rows={2}
              className={styles.input}
              value={profile.address}
              onChange={handleText("address")}
            />
          </Field>

          <Field label="City">
            <input
              type="text"
              className={styles.input}
              value={profile.city}
              onChange={handleText("city")}
            />
          </Field>

          <Field label="State">
            <input
              type="text"
              className={styles.input}
              value={profile.state}
              onChange={handleText("state")}
            />
          </Field>

          <Field label="Pincode">
            <input
              type="text"
              className={styles.input}
              value={profile.pincode}
              onChange={handleText("pincode")}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard icon="🛡️" title="KYC verification">
        <div className={styles.grid}>
          <Field label="KYC status">
            <select
              className={styles.input}
              value={profile.kycStatus}
              onChange={(e) =>
                update("kycStatus", e.target.value as KycStatus)
              }
            >
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </Field>

          <Field label="KYC document URL">
            <input
              type="url"
              className={styles.input}
              value={profile.kycDocumentUrl}
              onChange={handleText("kycDocumentUrl")}
            />
          </Field>

          <Field label="Profile picture URL">
            <input
              type="url"
              className={styles.input}
              value={profile.profilePictureUrl}
              onChange={handleText("profilePictureUrl")}
            />
          </Field>
        </div>
      </SectionCard>

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

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.secondary}`}
          onClick={() => {
            setProfile(INITIAL_PROFILE);
            setSaved(false);
          }}
        >
          Reset
        </button>

        <button
          className={`${styles.btn} ${styles.primary} ${
            saved ? styles.saved : ""
          }`}
          onClick={handleSave}
        >
          {saved ? "✓ Saved" : "Save changes"}
        </button>
      </div>

      {/* Wallet Modal */}
      <Wallet open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}