import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useGetQrCodeDataQuery } from '../../../apis/store/api/users';

export default function BackendRecipientQr() {
  const { data, isLoading, isError, refetch } = useGetQrCodeDataQuery();
  const [image, setImage] = useState('');
  const [renderError, setRenderError] = useState('');

  useEffect(() => {
    let active = true;
    setImage('');
    setRenderError('');
    if (!data?.payload) return () => { active = false; };

    void QRCode.toDataURL(data.payload, {
      errorCorrectionLevel: 'M',
      width: 240,
      margin: 2,
    })
      .then((url) => {
        if (active) setImage(url);
      })
      .catch(() => {
        if (active) setRenderError('Unable to render your QR.');
      });

    return () => { active = false; };
  }, [data]);

  if (isLoading) return <p>Loading your QR…</p>;
  if (isError || !data || renderError) {
    return <div><p role="alert">{renderError || 'Unable to load your QR.'}</p><button onClick={() => void refetch()}>Retry</button></div>;
  }
  if (!image) return <p>Preparing your QR…</p>;
  return <img src={image} alt={`Wallet recipient QR for ${data.upiId}`} width="240" height="240" />;
}
