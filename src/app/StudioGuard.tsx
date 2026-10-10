import { useIsPhone } from '../lib/useIsPhone';
import { Layout } from './Layout';
import { ToWatch } from './ToWatch';

/** The studio is a desktop tool: phones that open any studio page are sent to the read-only /watch player. */
export function StudioGuard() {
  return useIsPhone() ? <ToWatch /> : <Layout />;
}
