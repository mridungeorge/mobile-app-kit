import { render } from '@testing-library/react-native';
import { StateView } from '../src/components/StateView';

describe('StateView', () => {
  it('names the next action in the empty state', async () => {
    const view = await render(<StateView state={{ status: 'empty' }} />);
    expect(view.getByText('Nothing here yet')).toBeTruthy();
    expect(view.getByText(/Add your first habit/)).toBeTruthy();
  });

  it('keeps the error message and offers retry', async () => {
    const view = await render(<StateView state={{ status: 'error', message: 'Server down' }} onRetry={() => {}} />);
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText('Server down')).toBeTruthy();
    expect(view.getByText('Try again')).toBeTruthy();
  });
});
