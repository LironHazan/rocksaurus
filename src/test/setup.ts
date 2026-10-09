import '@testing-library/jest-dom/vitest';
import { installBrowserStandIns } from './browser-stand-in';

// Radix primitives measure elements; jsdom has no ResizeObserver.
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;

installBrowserStandIns();
