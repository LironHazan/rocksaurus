import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WatchEpisodes } from './WatchEpisodes';
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

describe('<WatchEpisodes>', () => {
  it('lists every episode under its folder, with lengths, and marks the playing one', () => {
    renderWithProviders(<WatchEpisodes folders={folders} activeId="b" onSelect={() => {}} />);
    expect(screen.getByRole('heading', { name: 'The Band' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rory' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /meet tiki taka/i })).toHaveTextContent('0:12');
    expect(screen.getByRole('button', { name: /pizza run/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /hello/i })).not.toHaveAttribute('aria-current');
  });

  it('selects an episode on tap', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<WatchEpisodes folders={folders} activeId="b" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /hello/i }));
    expect(onSelect).toHaveBeenCalledWith('c');
  });
});
