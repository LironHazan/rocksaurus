import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Transport } from './Transport';
import { renderWithProviders } from '../../../test/render';

const props = {
  time: 5.2,
  duration: 12,
  soundOn: false,
  paused: false,
  disabled: false,
  onTogglePause: vi.fn(),
  onRestart: vi.fn(),
  onToggleSound: vi.fn(),
  onSeek: vi.fn(),
};

describe('<Transport>', () => {
  it('shows the clock as current / total', () => {
    renderWithProviders(<Transport {...props} />);
    expect(screen.getByText('0:05')).toBeInTheDocument();
    expect(screen.getByText('/ 0:12')).toBeInTheDocument();
  });

  it('restarts and toggles sound', async () => {
    renderWithProviders(<Transport {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sound' }));
    expect(props.onRestart).toHaveBeenCalled();
    expect(props.onToggleSound).toHaveBeenCalled();
  });

  it('pauses', async () => {
    renderWithProviders(<Transport {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(props.onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('offers to play again once paused', async () => {
    renderWithProviders(<Transport {...props} paused />);
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(props.onTogglePause).toHaveBeenCalled();
  });

  it('seeks with the keyboard on the timeline', async () => {
    renderWithProviders(<Transport {...props} />);
    screen.getByRole('slider', { name: 'Timeline' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(props.onSeek).toHaveBeenCalledWith(expect.closeTo(5.3, 5));
  });
});
