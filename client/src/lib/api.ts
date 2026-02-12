import { API_BASE_URL } from '../config/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type ApiFetchOptions = Omit<RequestInit, 'credentials'> & {
  json?: any;
};

export async function apiFetch<T>(input: RequestInfo | URL, options: ApiFetchOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  // Build full URL if input is a string starting with /
  const url = typeof input === 'string' && input.startsWith('/') 
    ? `${API_BASE_URL}${input}` 
    : input;

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {})
    }
  };

  if (typeof json !== 'undefined') {
    init.body = JSON.stringify(json);
  }

  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';

  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const msg = data && typeof data === 'object' && 'error' in data ? String((data as any).error) : `request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}
