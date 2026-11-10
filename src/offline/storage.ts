import { base64, parseRecipient, signingBytes, signVoucher, verifyPayment } from './protocol';
import type { PaymentPacket } from './protocol';

export interface Receipt {
  packet: PaymentPacket;
  direction: 'SENT' | 'RECEIVED';
  status: 'PENDING_SETTLEMENT';
}
export interface OfflineState {
  revision: number;
  identity: string;
  allocation: string;
  publicKey: string;
  privateKey: CryptoKey;
  availablePaise: number;
  sequence: number;
  receipts: Receipt[];
  recipientImage?: string;
}
const DATABASE = 'uws-offline-qr-demo-v1';
const STORE = 'wallet';
const STATE_KEY = 'state';
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other offline demo tabs and try again.'));
  });
}
export async function readState(): Promise<OfflineState | undefined> {
  const db = await open();
  try {
    return await new Promise<OfflineState | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(STATE_KEY);
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}

// The callback must be synchronous: no signing/network awaits in an IDB transaction.
async function mutate(change: (state: OfflineState | undefined) => OfflineState): Promise<OfflineState> {
  const db = await open();
  try {
    return await new Promise<OfflineState>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.get(STATE_KEY);
      let result: OfflineState;
      let failure: unknown;
      request.onsuccess = () => {
        try { result = change(request.result); store.put(result, STATE_KEY); }
        catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('Storage transaction aborted.'));
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function initializeDemo(backendQr?: { payload: string; image: string }): Promise<OfflineState> {
  const recipient = backendQr ? parseRecipient(backendQr.payload) : undefined;
  const current = await readState();
  if (current) {
    if (recipient && current.identity !== recipient.recipient) throw new Error('This browser already has a different demo identity. Use a separate browser profile.');
    return current;
  }
  if (!globalThis.crypto?.subtle) throw new Error('Use HTTPS or localhost for offline signing.');
  const keys = await crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify']) as CryptoKeyPair;
  const publicKey = base64(await crypto.subtle.exportKey('raw', keys.publicKey));
  const initial: OfflineState = {
    revision: 0, identity: recipient?.recipient ?? crypto.randomUUID(), allocation: crypto.randomUUID(),
    publicKey, privateKey: keys.privateKey, availablePaise: 30_000, sequence: 0, receipts: [],
    recipientImage: backendQr?.image,
  };
  // Concurrent initialization never overwrites an already funded demo state.
  return mutate(existing => {
    if (existing && recipient && existing.identity !== recipient.recipient) throw new Error('Another tab initialized a different identity.');
    return existing ?? initial;
  });
}
export async function createPayment(payee: string, amount: number): Promise<PaymentPacket> {
  const snapshot = await readState();
  if (!snapshot) throw new Error('Create a demo wallet first.');
  const packet = await signVoucher({
    version: 1, id: crypto.randomUUID(), allocation: snapshot.allocation,
    payer: snapshot.identity, payee, amount, sequence: snapshot.sequence + 1,
    createdAt: Math.floor(Date.now() / 1000), nonce: crypto.randomUUID(),
  }, snapshot.privateKey, snapshot.publicKey);
  await mutate(current => {
    if (!current || current.revision !== snapshot.revision) throw new Error('Wallet changed in another tab. Review balance and try again.');
    if (amount > current.availablePaise) throw new Error('Insufficient demo funds.');
    if (current.receipts.length >= 500) throw new Error('Demo history limit reached. Export history before using a new demo profile.');
    return {
      ...current, revision: current.revision + 1, availablePaise: current.availablePaise - amount,
      sequence: packet.voucher.sequence,
      receipts: [...current.receipts, { packet, direction: 'SENT', status: 'PENDING_SETTLEMENT' }],
    };
  });
  // Show only after the voucher, counter and balance are durably committed.
  return packet;
}
export async function receivePayment(text: string): Promise<{ duplicate: boolean }> {
  const snapshot = await readState();
  if (!snapshot) throw new Error('Create a demo wallet first.');
  const packet = await verifyPayment(text, snapshot.identity);
  let duplicate = false;
  await mutate(current => {
    if (!current || current.identity !== snapshot.identity) throw new Error('Demo identity changed.');
    const prior = current.receipts.find(r => r.packet.voucher.id === packet.voucher.id);
    if (prior) {
      const same = prior.packet.publicKey === packet.publicKey
        && String(signingBytes(prior.packet.voucher)) === String(signingBytes(packet.voucher));
      if (!same) throw new Error('Conflicting payment with the same voucher ID.');
      duplicate = true;
      return current;
    }
    if (current.receipts.some(r => r.packet.voucher.allocation === packet.voucher.allocation
      && r.packet.voucher.sequence === packet.voucher.sequence)) throw new Error('Conflicting allocation sequence.');
    if (current.receipts.length >= 500) throw new Error('Demo history limit reached.');
    return {
      ...current, revision: current.revision + 1,
      receipts: [...current.receipts, { packet, direction: 'RECEIVED', status: 'PENDING_SETTLEMENT' }],
    };
  });
  return { duplicate };
}
