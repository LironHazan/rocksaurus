import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudioHeader } from './StudioHeader';
import { renderWithProviders } from '../../../test/render';
import { FORMATS } from '../../../engine/formats';

describe('<StudioHeader>', () => {
  const base = {
    title: 'Meet Lulu',
    duration: 16,
    formats: FORMATS,
    formatId: 'shorts' as const,
    recording: false,
    disabled: false,
  };

  it('shows the episode and the output size', () => {
    renderWithProviders(<StudioHeader {...base} onFormatChange={() => {}} onRecord={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Meet Lulu' })).toBeInTheDocument();
    expect(screen.getByText(/1080×1920/)).toBeInTheDocument();
  });

  it('switches format and starts recording', async () => {
    const onFormatChange = vi.fn();
    const onRecord = vi.fn();
    renderWithProviders(<StudioHeader {...base} onFormatChange={onFormatChange} onRecord={onRecord} />);
    await userEvent.click(screen.getByRole('radio', { name: 'YouTube 16:9' }));
    await userEvent.click(screen.getByRole('button', { name: /record video/i }));
    expect(onFormatChange).toHaveBeenCalledWith('landscape');
    expect(onRecord).toHaveBeenCalled();
  });

  it('shows progress and blocks a second recording', () => {
    renderWithProviders(<StudioHeader {...base} recording onFormatChange={() => {}} onRecord={() => {}} />);
    expect(screen.getByRole('button', { name: /recording/i })).toBeDisabled();
  });
});
