import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { keyFingerprint, parseAmount, parseRecipient, recipientQr } from './protocol';
import { createPayment, initializeDemo, readState, receivePayment } from './storage';
import type { OfflineState } from './storage';
import QrScanner from './QrScanner';
import { qrReader, readQrImage } from './qrReader';
import { useLazyGetQrCodeDataQuery } from '../apis/store/api/users';
import './offline.css';

function money(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function QrDisplay({ text, label }: { text: string; label: string }) {
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(text, { errorCorrectionLevel: 'M', width: 560, margin: 4 })
      .then(url => { if (active) { setImage(url); setError(''); } })
      .catch(() => { if (active) setError('Could not render this QR. Use the saved payload.'); });
    return () => { active = false; };
  }, [text]);
  return <div className="offline-qr">
    {image && <><img src={image} alt={label} /><a href={image} download="offline-qr.png">Download QR image</a></>}
    {error && <p role="alert">{error}</p>}
    <details><summary>Payload / manual transfer</summary><textarea readOnly value={text} aria-label={label + ' payload'} /></details>
  </div>;
}

export default function OfflineQrPage() {
  const [loadBackendQrData] = useLazyGetQrCodeDataQuery();
  const [state, setState] = useState<OfflineState>();
  const [fingerprint, setFingerprint] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [paymentInput, setPaymentInput] = useState('');
  const [amount, setAmount] = useState('100');
  const [outgoing, setOutgoing] = useState('');
  const [scanner, setScanner] = useState<'recipient' | 'payment' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const refresh = useCallback(async () => { setState(await readState()); }, []);

  useEffect(() => {
    let active = true;
    void readState().then(value => { if (active) setState(value); }).catch(e => { if (active) setError(String(e)); });
    const update = () => { setOnline(navigator.onLine); void refresh().catch(e => setError(String(e))); };
    window.addEventListener('online', update); window.addEventListener('offline', update); window.addEventListener('focus', update);
    return () => { active = false; window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('focus', update); };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    if (state) void keyFingerprint(state.publicKey).then(value => { if (active) setFingerprint(value); }).catch(e => { if (active) setError(String(e)); });
    return () => { active = false; };
  }, [state]);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Operation failed.'); }
    finally { await refresh().catch(e => setError(String(e))); setBusy(false); }
  }
  function scan(text: string) {
    if (scanner === 'recipient') setRecipientInput(text);
    else setPaymentInput(text);
    setScanner(null);
  }
  async function importImage(file: File | undefined, kind: 'recipient' | 'payment') {
    if (!file) return;
    await run(async () => {
      const text = await readQrImage(file);
      if (kind === 'recipient') setRecipientInput(text); else setPaymentInput(text);
      setMessage('QR decoded. Review it before continuing.');
    });
  }
  const pending = state?.receipts.filter(r => r.direction === 'RECEIVED').reduce((sum, r) => sum + r.packet.voucher.amount, 0) ?? 0;
  let recipientPreview = '';
  try { const r = parseRecipient(recipientInput); recipientPreview = `${r.name} · ${r.upiId} · ${r.recipient}`; } catch { /* Show validation errors on confirmation. */ }
  return <main className="offline-page">
    <header><a href="/userProfile">← Profile</a><span>{online ? 'Device reports online' : 'Device reports offline'}</span></header>
    <h1>Offline QR exchange</h1>
    <p className="offline-notice"><strong>Demo funds only.</strong> Exchange signed payments directly between two devices. Backend identity verification, real funding and settlement are not connected yet.</p>
    <p>Use HTTPS or localhost in a browser with Ed25519 support. Open a second browser profile or device for the recipient. Keep both pages open while testing without a network; offline reload support is a later step.</p>
    {error && <p className="offline-error" role="alert">{error}</p>}
    {message && <p className="offline-success" role="status">{message}</p>}
    {!state ? <><button disabled={busy} onClick={() => void run(async () => {
      const qrData = await loadBackendQrData().unwrap();
      const image = await QRCode.toDataURL(qrData.payload, {
        errorCorrectionLevel: 'M',
        width: 560,
        margin: 4,
      });
      const result = await qrReader().decodeFromImageUrl(image);
      await initializeDemo({ payload: result.getText(), image });
      setMessage('Existing backend recipient QR cached. INR 300 of demo funds only; no real allocation was made.');
    })}>Prepare demo with my existing backend QR (online)</button><button disabled={busy} onClick={() => void run(async () => {
      await initializeDemo(); setMessage('Demo wallet created with INR 300 of test funds.');
    })}>Standalone demo identity · INR 300 test funds</button></> : <>
      <section className="offline-summary">
        <div><span>Available demo funds</span><strong>{money(state.availablePaise)}</strong></div>
        <div><span>Received · pending, not spendable</span><strong>{money(pending)}</strong></div>
      </section>
      <details><summary>Your identity and demo key fingerprint</summary><p className="offline-mono">{state.identity}</p><p className="offline-mono">SHA-256: {fingerprint}</p><p>{state.recipientImage ? 'Recipient identity loaded from your backend QR.' : 'Standalone demo identity.'} The signing key is not enrolled with the backend. The private key stays in this browser's IndexedDB. Clearing site data loses the wallet and receipts.</p></details>
      <div className="offline-columns">
        <section><h2>1. Receive: show your identity</h2><p>The payer scans this first to address a payment to you.</p>
          {state.recipientImage ? <div className="offline-qr"><img src={state.recipientImage} alt="Cached backend recipient QR" /><p>Generated by user-service and saved for offline display.</p></div> : <QrDisplay text={recipientQr(state.identity)} label="Standalone demo recipient QR" />}
        </section>
        <section><h2>2. Send: create payment</h2>
          <button disabled={busy} onClick={() => setScanner('recipient')}>Scan recipient QR</button>
          <label>Or import recipient QR image<input type="file" accept="image/*" disabled={busy} onChange={e => { void importImage(e.target.files?.[0], 'recipient'); e.target.value = ''; }} /></label>
          <label>Recipient payload<textarea value={recipientInput} onChange={e => setRecipientInput(e.target.value)} /></label>
          {recipientPreview && <p className="offline-mono">Recipient (QR claims, not server verified): {recipientPreview}</p>}
          <label>Amount in rupees<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <p>Confirm the recipient with the other person. Creating a payment reserves your local demo funds immediately; reshow the saved QR if delivery is interrupted.</p>
          <button disabled={busy} onClick={() => void run(async () => {
            const recipient = parseRecipient(recipientInput);
            const packet = await createPayment(recipient.recipient, parseAmount(amount));
            setOutgoing(JSON.stringify(packet)); setMessage('Saved. Ask the recipient to scan the payment QR.');
          })}>Confirm amount and create signed payment</button>
        </section>
      </div>
      {scanner && <QrScanner key={scanner} onScan={scan} onClose={() => setScanner(null)} />}
      {outgoing && <section><h2>Payment QR · awaiting recipient</h2><QrDisplay key={outgoing} text={outgoing} label="Signed payment QR" /><button onClick={() => setOutgoing('')}>Hide QR (payment stays in history)</button></section>}
      <section><h2>3. Receive: save the payment</h2>
        <button disabled={busy} onClick={() => setScanner('payment')}>Scan payment QR</button>
        <label>Or import payment QR image<input type="file" accept="image/*" disabled={busy} onChange={e => { void importImage(e.target.files?.[0], 'payment'); e.target.value = ''; }} /></label>
        <label>Payment payload<textarea value={paymentInput} onChange={e => setPaymentInput(e.target.value)} /></label>
        <button disabled={busy} onClick={() => void run(async () => {
          const result = await receivePayment(paymentInput);
          setMessage(result.duplicate ? 'This payment is already saved. No duplicate receipt was added.' : 'Signature checked and receipt saved. Pending settlement; payer identity and funds are not server verified.');
          setPaymentInput('');
        })}>Verify and save pending receipt</button>
      </section>
      <section><h2>Payment history</h2><p>All records remain pending. Reconnecting does not settle them in this milestone.</p>
        <button onClick={() => download(JSON.stringify({ type: 'UWS-DEMO-HISTORY-1', identity: state.identity, receipts: state.receipts }, null, 2), 'offline-demo-history.json')}>Export receipts (no private key)</button>
        {!state.receipts.length && <p>No payments yet.</p>}
        <ul className="offline-history">{state.receipts.slice().reverse().map(r => <li key={r.packet.voucher.id}>
          <strong>{r.direction === 'SENT' ? 'Sent' : 'Received'} {money(r.packet.voucher.amount)}</strong><span>Pending settlement</span>
          <p className="offline-mono">{r.packet.voucher.id}</p>
          <p>{new Date(r.packet.voucher.createdAt * 1000).toLocaleString()} · Sequence {r.packet.voucher.sequence}</p>
          <p className="offline-mono">{r.direction === 'SENT' ? 'To' : 'From'}: {r.direction === 'SENT' ? r.packet.voucher.payee : r.packet.voucher.payer}</p>
          {r.direction === 'SENT' && <button onClick={() => setOutgoing(JSON.stringify(r.packet))}>Reshow same payment QR</button>}
        </li>)}</ul>
      </section>
    </>}
  </main>;
}
