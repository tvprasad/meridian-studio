import { config } from '../config';

export class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  baseUrl?: string;
  timeoutMs?: number;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, baseUrl = config.apiBaseUrl, timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;

  let url = `${baseUrl}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        ...(!(init.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...init.headers,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs}ms`, 0);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `Request failed: ${response.statusText}`,
      response.status,
      errorData.request_id
    );
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  postForm: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),

  postForBlob: async (endpoint: string, data?: unknown, options?: RequestOptions) => {
    const { params, baseUrl = config.apiBaseUrl, timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options ?? {};
    let url = `${baseUrl}${endpoint}`;
    if (params) url += `?${new URLSearchParams(params).toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: init.signal ?? controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...init.headers },
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, 0);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `Request failed: ${response.statusText}`,
        response.status,
        errorData.request_id,
      );
    }
    return response.blob();
  },
};