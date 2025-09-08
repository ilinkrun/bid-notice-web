import { API_BASE_URL } from '@/config/constants';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      data: null as T,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

export async function postToApi<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
  return fetchFromApi<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function putToApi<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
  return fetchFromApi<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteFromApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return fetchFromApi<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
} 