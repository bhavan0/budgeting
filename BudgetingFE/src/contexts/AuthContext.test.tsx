import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the api module
vi.mock('../lib/api', () => ({
  authApi: {
    googleLogin: vi.fn(),
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

// Test component that uses useAuth
function TestConsumer() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading.toString()}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="user">{user?.email || 'none'}</span>
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
});
