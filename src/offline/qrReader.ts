import { BrowserQRCodeReader } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';

export function qrReader() {
  return new BrowserQRCodeReader(new Map([[DecodeHintType.TRY_HARDER, true]]));
}

export async function readQrImage(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a QR image smaller than 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const result = await qrReader().decodeFromImageUrl(url);
    return result.getText();
  } catch { throw new Error('No readable QR found in that image.'); }
  finally { URL.revokeObjectURL(url); }
}
