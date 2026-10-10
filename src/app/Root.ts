// The app main.tsx renders: the full studio. `npm run build:public` (vite --mode public, what GitHub Pages serves)
// swaps this module for Root.public.ts, so the public site is built without the studio's code. See vite.config.ts.
export { App as Root } from './App';
