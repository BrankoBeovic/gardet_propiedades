import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import Navbar from './components/Navbar';

test('renders GARDET brand in navbar', async () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AuthProvider>
  );

  const brandElements = await screen.findAllByText(/GARDET/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
