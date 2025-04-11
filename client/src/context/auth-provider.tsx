import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { apiRequest } from "../lib/queryClient";

// Define a simple User type
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Create a context for auth state that can be consumed by components
interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string, role: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Auth methods
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      
      localStorage.setItem("instabuy_token", data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      return data.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };
  
  const register = async (username: string, email: string, password: string, role: string): Promise<User> => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", { 
        username, 
        email, 
        password,
        role 
      });
      const data = await response.json();
      
      localStorage.setItem("instabuy_token", data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      return data.user;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };
  
  const logout = () => {
    localStorage.removeItem("instabuy_token");
    setUser(null);
    setIsAuthenticated(false);
  };
  
  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("instabuy_token");
        
        if (!token) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        const response = await apiRequest("GET", "/api/auth/me", undefined);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token expired or invalid
          localStorage.removeItem("instabuy_token");
          setIsAuthenticated(false);
          setUser(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    
    checkAuth();
  }, []);

  const authContextValue = {
    isLoading,
    isAuthenticated,
    user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};