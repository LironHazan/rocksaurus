import { Navigate, useLocation } from 'react-router';

/**
 * Sends the visitor to the read-only /watch player. Only `?episode=…` is kept, so a shared link still opens the
 * right video; studio settings in the query (format, camera) are dropped.
 */
export function ToWatch() {
  const { search } = useLocation();
  const episode = new URLSearchParams(search).get('episode');
  return (
    <Navigate to={{ pathname: '/watch', search: episode ? `?${new URLSearchParams({ episode })}` : '' }} replace />
  );
}
