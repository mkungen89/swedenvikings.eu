import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Redirect to login if unauthorized
        // But only if not already on a public page
        const publicPaths = ['/', '/news', '/events', '/rules', '/clans', '/login'];
        if (!publicPaths.some(path => window.location.pathname.startsWith(path))) {
          window.location.href = '/login';
        }
      }
      
      // Return the error response data
      return Promise.reject(data?.error || error);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Type-safe API helpers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const response = await api.get<ApiResponse<T>>(url);
  return response.data;
}

export async function postApi<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await api.post<ApiResponse<T>>(url, data);
  return response.data;
}

export async function patchApi<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await api.patch<ApiResponse<T>>(url, data);
  return response.data;
}

export async function deleteApi<T>(url: string): Promise<ApiResponse<T>> {
  const response = await api.delete<ApiResponse<T>>(url);
  return response.data;
}

