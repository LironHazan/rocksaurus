import { Navigate, useLocation } from 'react-router';
import { useIsPhone } from '../lib/useIsPhone';
import { Layout } from './Layout';

/**
 * The studio is a desktop tool: phones that open any studio page are sent to the read-only /watch player.
 * Only `?episode=…` is kept, so a shared link still opens the right video.
 */
export function StudioGuard() {
  const phone = useIsPhone();
  const { search } = useLocation();
  if (!phone) return <Layout />;
  const episode = new URLSearchParams(search).get('episode');
  return (
    <Navigate to={{ pathname: '/watch', search: episode ? `?${new URLSearchParams({ episode })}` : '' }} replace />
  );
}
