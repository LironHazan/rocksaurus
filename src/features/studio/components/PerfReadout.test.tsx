import { screen } from '@testing-library/react';
import { PerfReadout } from './PerfReadout';
import { renderWithProviders } from '../../../test/render';

describe('<PerfReadout>', () => {
  it('shows the draw calls, triangles and frame rate', () => {
    renderWithProviders(<PerfReadout stats={{ drawCalls: 412, triangles: 1_234_567, fps: 59.6 }} />);
    expect(screen.getByLabelText('Performance')).toHaveTextContent('412 draw calls · 1.2M triangles · 60 fps');
  });

  it('shows nothing before the first sample', () => {
    const { container } = renderWithProviders(<PerfReadout stats={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
