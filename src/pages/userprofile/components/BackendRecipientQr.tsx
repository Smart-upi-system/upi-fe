import { useGetQrCodeQuery } from '../../../apis/store/api/users';

export default function BackendRecipientQr() {
  const { data, isLoading, isError, refetch } = useGetQrCodeQuery();
  if (isLoading) return <p>Loading your QR…</p>;
  if (isError || !data) return <div><p role="alert">Unable to load your QR.</p><button onClick={() => void refetch()}>Retry</button></div>;
  return <img src={data} alt="Wallet recipient QR" width="240" height="240" />;
}
