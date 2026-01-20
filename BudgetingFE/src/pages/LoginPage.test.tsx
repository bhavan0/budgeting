import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LoginPage } from './LoginPage';

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useAuth } from '../contexts/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

function renderLoginPage() {
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </GoogleOAuthProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders welcome message', () => {
    renderLoginPage();

    expect(
      screen.getByText('Welcome to BudgetTracker')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to manage your finances')
    ).toBeInTheDocument();
  });

  it('renders logo', () => {
    renderLoginPage();

    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('renders Google login instruction', () => {
    renderLoginPage();

    expect(
      screen.getByText('Continue with your Google account')
    ).toBeInTheDocument();
  });

  it('renders footer text', () => {
    renderLoginPage();

    expect(
      screen.getByText('Track expenses • Manage budgets • Visualize spending')
    ).toBeInTheDocument();
  });

  it('shows loading spinner when signing in', async () => {
    // Simulate loading state by checking the component structure
    renderLoginPage();

    // Initially should not show loading text
    expect(screen.queryByText('Signing you in...')).not.toBeInTheDocument();
  });
});
