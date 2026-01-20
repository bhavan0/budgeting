import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLoginWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: mockLogin,
      register: mockRegister,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn(),
    });
  });

  describe('Basic rendering', () => {
    it('renders welcome message', () => {
      renderLoginPage();

      expect(screen.getByText('Welcome to BudgetTracker')).toBeInTheDocument();
    });

    it('renders logo', () => {
      renderLoginPage();

      expect(screen.getByText('💰')).toBeInTheDocument();
    });

    it('renders footer text', () => {
      renderLoginPage();

      expect(
        screen.getByText('Track expenses • Manage budgets • Visualize spending')
      ).toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('renders Sign In tab by default', () => {
      renderLoginPage();

      expect(screen.getByText('Sign in to manage your finances')).toBeInTheDocument();
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
    });

    it('switches to Sign Up tab when clicked', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // Click the Sign Up tab button
      const buttons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(buttons[0]);

      expect(screen.getByText('Create an account to get started')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('switches back to Sign In tab when clicked', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // Switch to Sign Up
      const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(signUpButtons[0]);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();

      // Switch back to Sign In - get the first button which is the tab
      const signInButtons = screen.getAllByRole('button', { name: 'Sign In' });
      await user.click(signInButtons[0]);
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });
  });

  describe('Sign In form', () => {
    it('renders email and password inputs', () => {
      renderLoginPage();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('shows validation error for empty email', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText('Password'), 'password123');
      // Get the submit button (type="submit")
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);

      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });



    it('shows validation error for empty password', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);

      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('shows validation error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'short');
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('calls login on form submit with valid data', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      renderLoginPage();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('navigates to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      renderLoginPage();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shows error message on login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLoginPage();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Sign In' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Sign Up form', () => {
    it('renders name, email, password, and confirm password inputs', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(signUpButtons[0]);

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('shows validation error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(signUpButtons[0]);

      await user.type(screen.getByLabelText('Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.type(screen.getByLabelText('Confirm Password'), 'differentpassword');
      
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('shows validation error for empty name', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(signUpButtons[0]);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.type(screen.getByLabelText('Confirm Password'), 'password123');
      
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('calls register on form submit with valid data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);
      renderLoginPage();

      const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(signUpButtons[0]);

      await user.type(screen.getByLabelText('Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.type(screen.getByLabelText('Confirm Password'), 'password123');
      
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      });
    });

    it('navigates to dashboard on successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);
      renderLoginPage();

      const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(signUpButtons[0]);

      await user.type(screen.getByLabelText('Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.type(screen.getByLabelText('Confirm Password'), 'password123');
      
      const form = screen.getByLabelText('Email').closest('form');
      const submitButton = within(form!).getByRole('button', { name: 'Create Account' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Google login', () => {
    it('renders Google login button on Sign In tab', () => {
      renderLoginPage();

      // Google OAuth button should be present
      expect(screen.getByText('or continue with')).toBeInTheDocument();
    });

    it('renders Google login button on Sign Up tab', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const signUpButtons = screen.getAllByRole('button', { name: 'Sign Up' });
      await user.click(signUpButtons[0]);

      expect(screen.getByText('or continue with')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('does not show loading spinner initially', () => {
      renderLoginPage();

      expect(screen.queryByText('Signing you in...')).not.toBeInTheDocument();
      expect(screen.queryByText('Creating your account...')).not.toBeInTheDocument();
    });
  });
});
