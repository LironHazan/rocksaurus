import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { TooltipProvider } from '../ui';

/** render() with the app-wide providers components rely on. */
export const renderWithProviders = (ui: ReactElement) => render(<TooltipProvider>{ui}</TooltipProvider>);
