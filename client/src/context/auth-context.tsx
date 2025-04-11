import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { apiRequest } from "../lib/queryClient";
import { AuthResponse, UserInfo } from "../shared/types";

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserInfo>;
  register: (username: string, email: string, password: string, role: string) => Promise<UserInfo>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = (token: string) => {
    localStorage.setItem("instabuy_token", token);
  };

  const removeToken = () => {
    localStorage.removeItem("instabuy_token");
  };

  const login = useCallback(async (email: string, password: string): Promise<UserInfo> => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data: AuthResponse = await response.json();
      
      setUser(data.user);
      setIsAuthenticated(true);
      saveToken(data.token);
      
      return data.user;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, role: string): Promise<UserInfo> => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", { 
        username, 
        email, 
        password,
        role 
      });
      const data: AuthResponse = await response.json();
      
      setUser(data.user);
      setIsAuthenticated(true);
      saveToken(data.token);
      
      return data.user;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    removeToken();
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("instabuy_token");
    
    if (!token) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
    
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/auth/me", undefined);
      const userData = await response.json();
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      removeToken();
      setIsLoading(false);
      return false;
    }
  }, []);

  // Check authentication when component mounts
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
