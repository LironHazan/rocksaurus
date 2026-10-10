import { BrowserRouter, Route, Routes } from 'react-router';
import { TooltipProvider } from '../ui';
import { WatchPage } from '../features/watch/WatchPage';
import { ToWatch } from './ToWatch';

/**
 * The public site (GitHub Pages): only the /watch player. The studio (recording, snapshots, channel art) runs on the
 * owner's machine with `npm run dev` and is not in this build at all; any other path, an old studio link included,
 * lands on /watch, keeping its `?episode=`.
 */
export function PublicApp() {
  return (
    <TooltipProvider delayDuration={300}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="watch" element={<WatchPage />} />
          <Route path="*" element={<ToWatch />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
