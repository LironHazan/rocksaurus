import { BrowserRouter, Route, Routes } from 'react-router';
import { TooltipProvider } from '../ui';
import { Layout } from './Layout';
import { StudioPage } from '../features/studio/StudioPage';
import { BrandPage } from '../features/brand/BrandPage';

export function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<StudioPage />} />
            <Route path="brand" element={<BrandPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
