export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface StoreData {
  name: string;
  description: string;
  logo?: string;
}

export interface StoreWithProductCount extends StoreData {
  id: number;
  userId: number;
  createdAt: string;
  productCount: number;
}

export interface ProductUploadResponse {
  success: boolean;
  count: number;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
