import { API_BASE_URL } from '../../config/api';
export * from '../../services/authService';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data as T;
}

export async function loginUser(payload: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: { name: string; email: string; password: string }) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(token: string) {
  return request<{ user: AuthUser }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
