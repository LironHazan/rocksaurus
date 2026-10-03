import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { StudioGuard } from './StudioGuard';
import { PHONE_QUERY } from '../lib/useIsPhone';

/** Pretends the device matches (or doesn't match) the phone query. */
function device(phone: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: phone && query === PHONE_QUERY,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Where the watch page ended up, as path + query. */
const Watch = () => {
  const { pathname, search } = useLocation();
  return <p>{`watch: ${pathname}${search}`}</p>;
};

function at(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route element={<StudioGuard />}>
          <Route index element={<p>the studio</p>} />
          <Route path="brand" element={<p>channel art</p>} />
        </Route>
        <Route path="watch" element={<Watch />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('<StudioGuard>', () => {
  it('shows the studio and the channel art page on a desktop', () => {
    device(false);
    const { unmount } = at('/');
    expect(screen.getByText('the studio')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    unmount();
    at('/brand');
    expect(screen.getByText('channel art')).toBeInTheDocument();
  });

  it('sends a phone from every studio page to the watch page', () => {
    device(true);
    const { unmount } = at('/');
    expect(screen.getByText('watch: /watch')).toBeInTheDocument();
    expect(screen.queryByText('the studio')).not.toBeInTheDocument();
    unmount();
    at('/brand');
    expect(screen.getByText('watch: /watch')).toBeInTheDocument();
  });

  it('keeps the episode so a shared link still opens the right video, and drops the rest', () => {
    device(true);
    at('/?episode=meet-rory&format=landscape&cam=1,2,3,0,0,0');
    expect(screen.getByText('watch: /watch?episode=meet-rory')).toBeInTheDocument();
  });
});
