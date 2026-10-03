import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnapshotBar } from './SnapshotBar';
import { renderWithProviders } from '../../../test/render';

const props = {
  time: 5.2,
  crop: 'pinterest' as const,
  captions: false,
  disabled: false,
  onCropChange: vi.fn(),
  onCaptionsChange: vi.fn(),
  onSave: vi.fn(),
};

describe('<SnapshotBar>', () => {
  it('saves the snapshot at the current time', async () => {
    renderWithProviders(<SnapshotBar {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /save snapshot at 0:05/i }));
    expect(props.onSave).toHaveBeenCalled();
  });

  it('switches the shape and the captions', async () => {
    renderWithProviders(<SnapshotBar {...props} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Full frame' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Captions' }));
    expect(props.onCropChange).toHaveBeenCalledWith('full');
    expect(props.onCaptionsChange).toHaveBeenCalledWith(true);
  });

  it('is locked while recording', () => {
    renderWithProviders(<SnapshotBar {...props} disabled />);
    expect(screen.getByRole('button', { name: /save snapshot/i })).toBeDisabled();
  });
});
