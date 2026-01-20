import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('api function', () => {
    it('adds authorization header when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      // Import fresh module
      const { authApi } = await import('./api');
      await authApi.me();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('handles 401 by clearing storage and redirecting to login', async () => {
      mockLocalStorage.getItem.mockReturnValue('expired-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { authApi, ApiError } = await import('./api');

      await expect(authApi.me()).rejects.toThrow(ApiError);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocation.href).toBe('/login');
    });

    it('throws ApiError for non-OK responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad request' }),
      });

      const { authApi, ApiError } = await import('./api');

      await expect(authApi.me()).rejects.toThrow(ApiError);
    });

    it('returns undefined for 204 No Content responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const { categoriesApi } = await import('./api');
      const result = await categoriesApi.delete(1);

      expect(result).toBeUndefined();
    });
  });

  describe('authApi', () => {
    it('googleLogin sends correct request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            token: 'jwt-token',
            user: { id: '1', email: 'test@example.com' },
          }),
      });

      const { authApi } = await import('./api');
      const result = await authApi.googleLogin('google-credential');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/google'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ credential: 'google-credential' }),
        })
      );
      expect(result.token).toBe('jwt-token');
    });
  });

  describe('transactionsApi', () => {
    it('getAll builds correct URL with params', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: [],
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 0,
          }),
      });

      const { transactionsApi, TransactionType } = await import('./api');
      await transactionsApi.getAll({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        type: TransactionType.Expense,
        page: 1,
        pageSize: 10,
      });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('startDate=2024-01-01');
      expect(callUrl).toContain('endDate=2024-12-31');
      expect(callUrl).toContain('type=0');
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('pageSize=10');
    });
  });

  describe('statsApi', () => {
    it('getSummary builds correct URL with dates', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            totalIncome: 1000,
            totalExpenses: 500,
            balance: 500,
          }),
      });

      const { statsApi } = await import('./api');
      await statsApi.getSummary('2024-01-01', '2024-12-31');

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('/stats/summary');
      expect(callUrl).toContain('startDate=2024-01-01');
      expect(callUrl).toContain('endDate=2024-12-31');
    });
  });
});
