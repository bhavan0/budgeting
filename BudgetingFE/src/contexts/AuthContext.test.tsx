import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the api module
vi.mock('../lib/api', () => ({
  authApi: {
    googleLogin: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Helper to create a test QueryClient
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

// Test component that uses useAuth with error handling
function TestConsumer({ 
  onLogin, 
  onRegister,
  onLoginError,
  onRegisterError 
}: { 
  onLogin?: () => void; 
  onRegister?: () => void;
  onLoginError?: (error: Error) => void;
  onRegisterError?: (error: Error) => void;
}) {
  const { user, isLoading, isAuthenticated, login, register, logout } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password123');
      onLogin?.();
    } catch (error) {
      onLoginError?.(error as Error);
    }
  };

  const handleRegister = async () => {
    try {
      await register('test@example.com', 'password123', 'Test User');
      onRegister?.();
    } catch (error) {
      onRegisterError?.(error as Error);
    }
  };

  return (
    <div>
      <span data-testid="loading">{isLoading.toString()}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="user">{user?.email || 'none'}</span>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.store = {};
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('initializes with no user when no stored credentials', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('initializes with stored user and validates token', async () => {
    const storedUser = { id: '1', email: 'test@example.com', name: 'Test' };
    mockLocalStorage.store['token'] = 'valid-token';
    mockLocalStorage.store['user'] = JSON.stringify(storedUser);

    const { authApi } = await import('../lib/api');
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValueOnce(storedUser);

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('test@example.com');
  });

  it('clears auth when token validation fails', async () => {
    mockLocalStorage.store['token'] = 'invalid-token';
    mockLocalStorage.store['user'] = JSON.stringify({
      id: '1',
      email: 'test@example.com',
    });

    const { authApi } = await import('../lib/api');
    (authApi.me as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Unauthorized')
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('useAuth throws when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function InvalidComponent() {
      useAuth();
      return null;
    }

    expect(() => render(<InvalidComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    consoleSpy.mockRestore();
  });

  describe('login', () => {
    it('calls login API and stores token/user on success', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      const mockResponse = { token: 'new-token', user: mockUser };

      const { authApi } = await import('../lib/api');
      (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      const queryClient = createTestQueryClient();
      const onLogin = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestConsumer onLogin={onLogin} />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Login' }));
      });

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });

    it('calls error handler on API failure', async () => {
      const user = userEvent.setup();
      const { authApi } = await import('../lib/api');
      (authApi.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Invalid credentials'));

      const queryClient = createTestQueryClient();
      const onLoginError = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestConsumer onLoginError={onLoginError} />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Login' }));
      });

      await waitFor(() => {
        expect(onLoginError).toHaveBeenCalledWith(expect.any(Error));
      });
      
      expect(onLoginError.mock.calls[0][0].message).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('calls register API and stores token/user on success', async () => {
      const user = userEvent.setup();
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      const mockResponse = { token: 'new-token', user: mockUser };

      const { authApi } = await import('../lib/api');
      (authApi.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      const queryClient = createTestQueryClient();
      const onRegister = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestConsumer onRegister={onRegister} />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Register' }));
      });

      await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
    });

    it('calls error handler on API failure', async () => {
      const user = userEvent.setup();
      const { authApi } = await import('../lib/api');
      (authApi.register as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Email already exists'));

      const queryClient = createTestQueryClient();
      const onRegisterError = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TestConsumer onRegisterError={onRegisterError} />
          </AuthProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Register' }));
      });

      await waitFor(() => {
        expect(onRegisterError).toHaveBeenCalledWith(expect.any(Error));
      });
      
      expect(onRegisterError.mock.calls[0][0].message).toBe('Email already exists');
    });
  });
});
