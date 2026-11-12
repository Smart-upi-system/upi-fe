import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  useGetUpiPinStatusQuery,
  useSetUpiPinMutation,
} from '../../../apis/store/api/auth';

export default function UpiPinSettings() {
  const { data: status, isLoading: loadingStatus, refetch } = useGetUpiPinStatusQuery();
  const [setUpiPin, { isLoading: saving }] = useSetUpiPinMutation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!/^\d{6}$/.test(newPin)) {
      setError('UPI PIN must contain exactly 6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('UPI PIN confirmation does not match.');
      return;
    }

    try {
      await setUpiPin({ currentPassword, newPin, confirmPin }).unwrap();
      setCurrentPassword('');
      setNewPin('');
      setConfirmPin('');
      setMessage('UPI PIN saved securely.');
      await refetch();
    } catch {
      setError('Could not save the UPI PIN. Check your account password.');
    }
  }

  return (
    <form onSubmit={submit} style={styles.card} autoComplete="off">
      <div>
        <h3 style={styles.title}>UPI PIN</h3>
        <p style={styles.description}>
          {loadingStatus
            ? 'Checking PIN status…'
            : status?.configured
              ? 'Your wallet PIN is configured. Change it using your account password.'
              : 'Create a six-digit PIN for authorizing wallet payments.'}
        </p>
      </div>

      <label style={styles.label}>
        Current account password
        <input
          style={styles.input}
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label style={styles.label}>
        New six-digit UPI PIN
        <input
          style={styles.input}
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={newPin}
          onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ''))}
          autoComplete="new-password"
          required
        />
      </label>
      <label style={styles.label}>
        Confirm UPI PIN
        <input
          style={styles.input}
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={confirmPin}
          onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ''))}
          autoComplete="new-password"
          required
        />
      </label>

      {error && <p role="alert" style={styles.error}>{error}</p>}
      {message && <p role="status" style={styles.success}>{message}</p>}
      <button type="submit" disabled={saving} style={styles.button}>
        {saving ? 'Saving…' : status?.configured ? 'Change UPI PIN' : 'Set UPI PIN'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'grid',
    gap: 12,
    padding: 20,
    border: '1px solid #e8e8e8',
    borderRadius: 16,
    background: '#fff',
  },
  title: { margin: 0, fontSize: 16, color: '#222' },
  description: { margin: '6px 0 0', fontSize: 13, color: '#666', lineHeight: 1.45 },
  label: { display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: '#666' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10,
    border: '1px solid #ccc', fontSize: 15, letterSpacing: 2,
  },
  button: {
    justifySelf: 'start', border: 0, borderRadius: 10, padding: '10px 16px',
    background: '#111', color: '#fff', cursor: 'pointer', fontWeight: 600,
  },
  error: { margin: 0, color: '#9b1c1c', fontSize: 13 },
  success: { margin: 0, color: '#1a6b3c', fontSize: 13 },
};
