import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WatchControls } from './WatchControls';
import { renderWithProviders } from '../../../test/render';

const props = {
  time: 5.2,
  duration: 12,
  soundOn: false,
  paused: false,
  disabled: false,
  onTogglePause: vi.fn(),
  onToggleSound: vi.fn(),
  onSeek: vi.fn(),
};

describe('<WatchControls>', () => {
  it('shows the clock as current / total', () => {
    renderWithProviders(<WatchControls {...props} />);
    expect(screen.getByText('0:05')).toBeInTheDocument();
    expect(screen.getByText('/ 0:12')).toBeInTheDocument();
  });

  it('pauses, and offers to play once paused', async () => {
    const { unmount } = renderWithProviders(<WatchControls {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(props.onTogglePause).toHaveBeenCalledTimes(1);
    unmount();
    renderWithProviders(<WatchControls {...props} paused />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('toggles sound and seeks', async () => {
    renderWithProviders(<WatchControls {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sound' }));
    expect(props.onToggleSound).toHaveBeenCalled();
    screen.getByRole('slider', { name: 'Timeline' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(props.onSeek).toHaveBeenCalledWith(expect.closeTo(5.3, 5));
  });

  it('is locked until the player is ready', () => {
    renderWithProviders(<WatchControls {...props} disabled />);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sound' })).toBeDisabled();
  });
});
