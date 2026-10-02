import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EpisodeList } from './EpisodeList';
import { renderWithProviders } from '../../../test/render';
import type { Episode } from '../../../engine/types';
import type { EpisodeFolder } from '../../../episodes';

const episode = (id: string, title: string, duration: number): Episode => ({
  id,
  title,
  duration,
  setup: () => ({ update() {} }),
});

const folders: EpisodeFolder[] = [
  { id: 'band', title: 'The Band', episodes: [episode('a', 'Meet Tiki Taka', 12), episode('b', 'Pizza Run', 52)] },
  { id: 'rory', title: 'Rory', episodes: [episode('c', 'Hello', 8)] },
];

describe('<EpisodeList>', () => {
  it('opens the active episode folder and marks the active episode', () => {
    renderWithProviders(<EpisodeList folders={folders} activeId="b" onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /the band/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /^rory/i })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /meet tiki taka/i })).toHaveTextContent('0:12');
    expect(screen.getByRole('button', { name: /pizza run/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: /hello/i })).not.toBeInTheDocument();
  });

  it('toggles folders open and closed', async () => {
    renderWithProviders(<EpisodeList folders={folders} activeId="b" onSelect={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /^rory/i }));
    expect(screen.getByRole('button', { name: /hello/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /the band/i }));
    expect(screen.queryByRole('button', { name: /pizza run/i })).not.toBeInTheDocument();
  });

  it('reveals the folder when the active episode changes', () => {
    const { rerender } = renderWithProviders(<EpisodeList folders={folders} activeId="b" onSelect={() => {}} />);
    rerender(<EpisodeList folders={folders} activeId="c" onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /hello/i })).toHaveAttribute('aria-current', 'page');
  });

  it('selects an episode on click', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<EpisodeList folders={folders} activeId="b" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /meet tiki taka/i }));
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('locks episodes (not folders) while recording', () => {
    renderWithProviders(<EpisodeList folders={folders} activeId="a" disabled onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /meet tiki taka/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /the band/i })).toBeEnabled();
  });
});
