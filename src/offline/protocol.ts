// Demo-only envelope: deliberately distinct from the future server protocol.
export const DEMO_TAG = 'UWS-QR-DEMO-1';
export const MAX_PACKET_LENGTH = 2400;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Voucher {
  version: 1;
  id: string;
  allocation: string;
  payer: string;
  payee: string;
  amount: number;
  sequence: number;
  createdAt: number;
  nonce: string;
}
export interface PaymentPacket {
  type: 'UWS-QR-DEMO-1';
  voucher: Voucher;
  publicKey: string;
  signature: string;
}
export interface RecipientPacket { recipient: string; name: string; upiId: string }

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid QR object.');
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).length !== keys.length || keys.some(k => !(k in value))) {
    throw new Error('Unsupported QR fields or version.');
  }
}
function uuid(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new Error('Invalid payment identity.');
}
function positiveInteger(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Invalid integer payment value.');
  }
}
export function validateVoucher(value: unknown): Voucher {
  const v = record(value);
  exactKeys(v, ['version', 'id', 'allocation', 'payer', 'payee', 'amount', 'sequence', 'createdAt', 'nonce']);
  if (v.version !== 1) throw new Error('Unsupported payment version.');
  for (const field of ['id', 'allocation', 'payer', 'payee', 'nonce']) uuid(v[field]);
  for (const field of ['amount', 'sequence', 'createdAt']) positiveInteger(v[field]);
  if (v.amount as number > 30_000 || v.payer === v.payee) throw new Error('Invalid demo payment.');
  return v as unknown as Voucher;
}

// Fixed field order, ASCII-only validated values, separate signing domain.
export function signingBytes(v: Voucher): Uint8Array<ArrayBuffer> {
  validateVoucher(v);
  return new TextEncoder().encode(JSON.stringify([
    DEMO_TAG, v.version, v.id, v.allocation, v.payer, v.payee,
    v.amount, 'INR', v.sequence, v.createdAt, v.nonce,
  ]));
}
export function base64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function unbase64(value: unknown, length: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length > 128 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error('Invalid key or signature encoding.');
  }
  const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0));
  if (bytes.length !== length || base64(bytes.buffer) !== value) throw new Error('Invalid key or signature length.');
  return bytes;
}
function parse(text: string): Record<string, unknown> {
  if (!text || text.length > MAX_PACKET_LENGTH) throw new Error('QR payload is empty or too large.');
  try { return record(JSON.parse(text)); } catch { throw new Error('Not a supported offline QR payload.'); }
}
export function recipientQr(recipient: string): string {
  uuid(recipient);
  // Only for the standalone demo. Real users display the cached backend PNG.
  return JSON.stringify({ userId: recipient, upiId: 'demo@local', number: '', walletId: recipient, name: 'Demo recipient' });
}
export function parseRecipient(text: string): RecipientPacket {
  const r = parse(text);
  // Existing QrCodeServiceImpl.buildPayload contract. Display fields are not
  // trusted credentials; settlement will resolve the user/wallet on the server.
  exactKeys(r, ['userId', 'upiId', 'number', 'walletId', 'name']);
  uuid(r.userId);
  for (const field of ['upiId', 'number', 'walletId', 'name']) {
    if (typeof r[field] !== 'string' || (r[field] as string).length > 200) throw new Error('Invalid recipient QR fields.');
  }
  return { recipient: r.userId, name: r.name as string, upiId: r.upiId as string };
}
export function parseAmount(text: string): number {
  if (!/^(0|[1-9]\d{0,2})(\.\d{1,2})?$/.test(text)) throw new Error('Enter rupees with at most two decimal places.');
  const [whole, decimal = ''] = text.split('.');
  const amount = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (amount <= 0 || amount > 30_000) throw new Error('Demo payment must be between INR 0.01 and INR 300.');
  return amount;
}
export async function signVoucher(voucher: Voucher, privateKey: CryptoKey, publicKey: string): Promise<PaymentPacket> {
  const signature = await crypto.subtle.sign('Ed25519', privateKey, signingBytes(voucher));
  return { type: DEMO_TAG, voucher, publicKey, signature: base64(signature) };
}
export async function verifyPayment(text: string, recipient: string): Promise<PaymentPacket> {
  uuid(recipient);
  const p = parse(text);
  exactKeys(p, ['type', 'voucher', 'publicKey', 'signature']);
  if (p.type !== DEMO_TAG) throw new Error('Scan a demo payment QR.');
  const v = validateVoucher(p.voucher);
  if (v.payee !== recipient) throw new Error('This payment is addressed to a different recipient.');
  const key = await crypto.subtle.importKey('raw', unbase64(p.publicKey, 32), 'Ed25519', false, ['verify']);
  const valid = await crypto.subtle.verify('Ed25519', key, unbase64(p.signature, 64), signingBytes(v));
  if (!valid) throw new Error('Payment signature is invalid. No receipt was saved.');
  return p as unknown as PaymentPacket;
}
export async function keyFingerprint(publicKey: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', unbase64(publicKey, 32));
  return Array.from(new Uint8Array(hash)).map(n => n.toString(16).padStart(2, '0')).join('');
}
