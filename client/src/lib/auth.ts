import { AuthResponse, ApiError } from "@/shared/types";

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    // Get payload part of token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    const expiry = payload.exp * 1000; // Convert seconds to milliseconds
    return Date.now() >= expiry;
  } catch (error) {
    return true; // If there's an error parsing the token, assume it's expired
  }
};

// Get token from local storage
export const getToken = (): string | null => {
  const token = localStorage.getItem('instabuy_token');
  if (!token) return null;
  
  // If token is expired, remove it
  if (isTokenExpired(token)) {
    localStorage.removeItem('instabuy_token');
    return null;
  }
  
  return token;
};

// Add authorization header to fetch options
export const addAuthHeader = (options: RequestInit = {}): RequestInit => {
  const token = getToken();
  if (!token) return options;
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  };
};

// Handle API errors
export const handleApiError = async (response: Response): Promise<ApiError> => {
  try {
    const data = await response.json();
    return {
      message: data.message || response.statusText,
      status: response.status,
    };
  } catch (error) {
    return {
      message: response.statusText || 'An error occurred',
      status: response.status,
    };
  }
};
