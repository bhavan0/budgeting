import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function TestChild() {
  return <div data-testid="protected-content">Protected Content</div>;
}

function LoginPage() {
  return <div data-testid="login-page">Login Page</div>;
}

function renderWithRouter(isAuthenticated: boolean, isLoading: boolean) {
  mockUseAuth.mockReturnValue({
    isAuthenticated,
    isLoading,
    user: isAuthenticated ? { id: '1', email: 'test@example.com' } : null,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <TestChild />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders loading spinner when isLoading is true', () => {
    renderWithRouter(false, true);

    // Check for the spinner (animated element)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Protected content should not be visible
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderWithRouter(false, false);

    // Should show login page after redirect
    expect(screen.getByTestId('login-page')).toBeInTheDocument();

    // Protected content should not be visible
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    renderWithRouter(true, false);

    // Protected content should be visible
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();

    // Login page should not be visible
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
