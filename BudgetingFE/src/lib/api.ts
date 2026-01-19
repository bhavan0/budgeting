const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'An error occurred');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth API
export const authApi = {
  googleLogin: (credential: string) =>
    api<AuthResponse>('/auth/google', { method: 'POST', body: { credential } }),
  
  me: () => api<User>('/auth/me'),
};

// Categories API
export const categoriesApi = {
  getAll: (type?: TransactionType) =>
    api<Category[]>(`/categories${type !== undefined ? `?type=${type}` : ''}`),
  
  getById: (id: number) => api<Category>(`/categories/${id}`),
  
  create: (data: CreateCategoryRequest) =>
    api<Category>('/categories', { method: 'POST', body: data }),
  
  update: (id: number, data: UpdateCategoryRequest) =>
    api<Category>(`/categories/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: number) => api<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: TransactionParams) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.type !== undefined) searchParams.set('type', params.type.toString());
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    
    const query = searchParams.toString();
    return api<PaginatedResponse<Transaction>>(`/transactions${query ? `?${query}` : ''}`);
  },
  
  getById: (id: number) => api<Transaction>(`/transactions/${id}`),
  
  create: (data: CreateTransactionRequest) =>
    api<Transaction>('/transactions', { method: 'POST', body: data }),
  
  update: (id: number, data: UpdateTransactionRequest) =>
    api<Transaction>(`/transactions/${id}`, { method: 'PUT', body: data }),
  
  delete: (id: number) => api<void>(`/transactions/${id}`, { method: 'DELETE' }),
};

// Stats API
export const statsApi = {
  getSummary: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString();
    return api<Summary>(`/stats/summary${query ? `?${query}` : ''}`);
  },
  
  getByCategory: (type?: TransactionType, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (type !== undefined) params.set('type', type.toString());
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString();
    return api<CategoryStats[]>(`/stats/by-category${query ? `?${query}` : ''}`);
  },
  
  getOverTime: (period: string = 'daily', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return api<TimePeriodStats[]>(`/stats/over-time?${params.toString()}`);
  },
};

// AI API
export const aiApi = {
  chat: (message: string) =>
    api<{ response: string }>('/ai/chat', { method: 'POST', body: { message } }),
};

// Types
export enum TransactionType {
  Expense = 0,
  Income = 1,
}

export interface User {
  id: string;
  email: string;
  name?: string;
  profilePictureUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: number;
  amount: number;
  description?: string;
  date: string;
  type: TransactionType;
  categoryId: number;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
}

export interface CreateTransactionRequest {
  amount: number;
  description?: string;
  date: string;
  type: TransactionType;
  categoryId: number;
}

export interface UpdateTransactionRequest {
  amount?: number;
  description?: string;
  date?: string;
  type?: TransactionType;
  categoryId?: number;
}

export interface TransactionParams {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeChange?: number;
  expensesChange?: number;
}

export interface CategoryStats {
  categoryId: number;
  categoryName: string;
  categoryColor?: string;
  total: number;
  count: number;
}

export interface TimePeriodStats {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export { ApiError };
