import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import QRCode from 'qrcode';
import { BinaryBitmap, DecodeHintType, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library';
import { base64, parseAmount, parseRecipient, recipientQr, signVoucher, verifyPayment } from '../src/offline/protocol.ts';
import type { Voucher } from '../src/offline/protocol.ts';
import { createPayment, initializeDemo, readState, receivePayment } from '../src/offline/storage.ts';

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('uws-offline-qr-demo-v1');
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
});

async function paymentFor(payee: string, amount = 10_000) {
  const keys = await crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify']) as CryptoKeyPair;
  const voucher: Voucher = {
    version: 1, id: crypto.randomUUID(), allocation: crypto.randomUUID(), payer: crypto.randomUUID(),
    payee, amount, sequence: 1, createdAt: Math.floor(Date.now() / 1000), nonce: crypto.randomUUID(),
  };
  const publicKey = base64(await crypto.subtle.exportKey('raw', keys.publicKey));
  return { keys, packet: await signVoucher(voucher, keys.privateKey, publicKey) };
}
test('amounts are exact paise and malformed/oversize amounts fail', () => {
  assert.equal(parseAmount('0.01'), 1); assert.equal(parseAmount('100.10'), 10010);
  for (const bad of ['-1', '0', '1e2', '01', '1.001', '300.01', 'NaN']) assert.throws(() => parseAmount(bad));
});
test('recipient QR is distinct and validated', () => {
  const id = crypto.randomUUID();
  assert.equal(parseRecipient(recipientQr(id)).recipient, id);
  assert.throws(() => parseRecipient('{"type":"other","recipient":"bad"}'));
});
test('existing backend recipient schema is accepted and cached without regeneration', async () => {
  const id = crypto.randomUUID();
  const payload = JSON.stringify({ userId: id, upiId: 'bob@wallet', number: '0000000000', walletId: crypto.randomUUID(), name: 'Bob Example' });
  assert.equal(parseRecipient(payload).recipient, id);
  const state = await initializeDemo({ payload, image: 'data:image/png;base64,dGVzdA==' });
  assert.equal(state.identity, id);
  assert.equal((await readState())!.recipientImage, 'data:image/png;base64,dGVzdA==');
  await assert.rejects(initializeDemo({ payload: recipientQr(crypto.randomUUID()), image: 'other' }), /different demo identity/);
});
test('signed payment verifies; tampering and wrong recipient fail', async () => {
  const id = crypto.randomUUID(); const { packet } = await paymentFor(id);
  assert.equal((await verifyPayment(JSON.stringify(packet), id)).voucher.amount, 10000);
  await assert.rejects(verifyPayment(JSON.stringify(packet), crypto.randomUUID()), /different recipient/);
  await assert.rejects(verifyPayment(JSON.stringify({ ...packet, voucher: { ...packet.voucher, amount: 9999 } }), id), /signature is invalid/);
  await assert.rejects(verifyPayment(JSON.stringify({ ...packet, signature: 'bad' }), id));
  await assert.rejects(verifyPayment('x'.repeat(2401), id), /too large/);
});
test('initialization persists non-exportable key and does not replenish funds', async () => {
  const initial = await initializeDemo();
  assert.equal(initial.privateKey.extractable, false);
  await assert.rejects(crypto.subtle.exportKey('pkcs8', initial.privateKey));
  await createPayment(crypto.randomUUID(), 10000);
  const restored = await initializeDemo();
  assert.equal(restored.identity, initial.identity); assert.equal(restored.availablePaise, 20000);
  assert.equal(restored.receipts.length, 1); assert.equal(restored.sequence, 1);
  await verifyPayment(JSON.stringify(restored.receipts[0].packet), restored.receipts[0].packet.voucher.payee);
});
test('concurrent initialization creates only one wallet', async () => {
  const [a, b] = await Promise.all([initializeDemo(), initializeDemo()]);
  assert.equal(a.identity, b.identity);
});
test('concurrent spending cannot overspend and rejected payment changes no state', async () => {
  await initializeDemo();
  const results = await Promise.allSettled([createPayment(crypto.randomUUID(), 20000), createPayment(crypto.randomUUID(), 20000)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const state = (await readState())!;
  assert.equal(state.availablePaise, 10000); assert.equal(state.receipts.length, 1); assert.equal(state.sequence, 1);
  await assert.rejects(createPayment(crypto.randomUUID(), 10001), /Insufficient/);
  assert.equal((await readState())!.availablePaise, 10000);
});
test('negative and self payments leave local funds unchanged', async () => {
  const state = await initializeDemo();
  await assert.rejects(createPayment(crypto.randomUUID(), -100));
  await assert.rejects(createPayment(state.identity, 100));
  assert.equal((await readState())!.availablePaise, 30000);
});
test('receive is pending, durable, deduplicated, and does not credit spendable funds', async () => {
  const state = await initializeDemo(); const { packet } = await paymentFor(state.identity);
  const results = await Promise.all([receivePayment(JSON.stringify(packet)), receivePayment(JSON.stringify(packet))]);
  assert.equal(results.filter(r => r.duplicate).length, 1);
  const restored = (await readState())!;
  assert.equal(restored.receipts.length, 1); assert.equal(restored.availablePaise, 30000);
  assert.equal(restored.receipts[0].status, 'PENDING_SETTLEMENT');
});
test('conflicting same-ID and same-sequence vouchers are rejected', async () => {
  const state = await initializeDemo(); const { packet, keys } = await paymentFor(state.identity);
  await receivePayment(JSON.stringify(packet));
  const changed = await signVoucher({ ...packet.voucher, amount: 9999 }, keys.privateKey, packet.publicKey);
  await assert.rejects(receivePayment(JSON.stringify(changed)), /same voucher ID/);
  const second = await signVoucher({ ...packet.voucher, id: crypto.randomUUID() }, keys.privateKey, packet.publicKey);
  await assert.rejects(receivePayment(JSON.stringify(second)), /allocation sequence/);
  assert.equal((await readState())!.receipts.length, 1);
});
test('valid out-of-order sequences can be received', async () => {
  const state = await initializeDemo(); const { packet, keys } = await paymentFor(state.identity);
  const third = await signVoucher({ ...packet.voucher, id: crypto.randomUUID(), sequence: 3 }, keys.privateKey, packet.publicKey);
  await receivePayment(JSON.stringify(third)); await receivePayment(JSON.stringify(packet));
  assert.equal((await readState())!.receipts.length, 2);
});
test('actual payment QR pixels decode to the same verifiable payload', async () => {
  const payee = crypto.randomUUID(); const { packet } = await paymentFor(payee);
  const text = JSON.stringify(packet);
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const scale = 5, margin = 4, size = (qr.modules.size + margin * 2) * scale;
  const pixels = new Uint8ClampedArray(size * size).fill(255);
  for (let y = 0; y < qr.modules.size; y++) for (let x = 0; x < qr.modules.size; x++) {
    if (qr.modules.get(y, x)) for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      pixels[((y + margin) * scale + dy) * size + (x + margin) * scale + dx] = 0;
    }
  }
  const decoded = new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, size, size))), new Map([[DecodeHintType.TRY_HARDER, true]])).getText();
  assert.equal(decoded, text);
  await verifyPayment(decoded, payee);
});
