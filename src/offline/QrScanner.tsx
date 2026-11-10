import { useEffect, useRef, useState } from 'react';
import { qrReader } from './qrReader';

export default function QrScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const scanCallback = useRef(onScan);
  const [error, setError] = useState('');
  useEffect(() => { scanCallback.current = onScan; }, [onScan]);
  useEffect(() => {
    let stopped = false;
    let stop: (() => void) | undefined;
    const reader = qrReader();
    if (video.current) {
      void reader.decodeFromConstraints({ video: { facingMode: 'environment' }, audio: false }, video.current,
        (result, _error, controls) => {
          if (result && !stopped) {
            stopped = true;
            controls.stop();
            scanCallback.current(result.getText());
          }
        }).then(controls => {
          stop = () => controls.stop();
          if (stopped) stop();
        }).catch(() => {
          if (!stopped) setError('Camera unavailable. Allow camera access on HTTPS/localhost, or import a QR image below.');
        });
    }
    return () => { stopped = true; stop?.(); };
  }, []);
  return <div className="offline-scanner">
    <video ref={video} muted playsInline aria-label="QR camera preview" />
    {error && <p role="alert">{error}</p>}
    <button onClick={onClose}>Close camera</button>
  </div>;
}

