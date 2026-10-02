import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EpisodeList } from './EpisodeList';
import { renderWithProviders } from '../../../test/render';
import type { Episode } from '../../../engine/types';

const episodes: Episode[] = [
  { id: 'a', title: 'Meet Tiki Taka', duration: 12, setup: () => ({ update() {} }) },
  { id: 'b', title: 'Pizza Run', duration: 52, setup: () => ({ update() {} }) },
];

describe('<EpisodeList>', () => {
  it('shows every episode with its length and marks the active one', () => {
    renderWithProviders(<EpisodeList episodes={episodes} activeId="b" onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /meet tiki taka/i })).toHaveTextContent('0:12');
    expect(screen.getByRole('button', { name: /pizza run/i })).toHaveAttribute('aria-current', 'page');
  });

  it('selects an episode on click', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<EpisodeList episodes={episodes} activeId="b" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /meet tiki taka/i }));
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('is locked while recording', () => {
    renderWithProviders(<EpisodeList episodes={episodes} activeId="a" disabled onSelect={() => {}} />);
    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled();
  });
});
