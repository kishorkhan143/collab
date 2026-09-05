import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, authStorage } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: () => void;
  demoSwitch: (email: string) => Promise<void>;
  resetDemoDatabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USERS = [
  { id: '1', name: 'Arun', email: 'arun@gmail.com', roleDesc: 'Admin (College Project)' },
  { id: '2', name: 'Kishor', email: 'kishor@gmail.com', roleDesc: 'Member (Assigned Dev)' },
  { id: '4', name: 'Priya', email: 'priya@gmail.com', roleDesc: 'Admin (Startup) / Member' },
  { id: '3', name: 'Rahul', email: 'rahul@gmail.com', roleDesc: 'Member (Auth Dev)' },
  { id: '5', name: 'Vijay', email: 'vijay@gmail.com', roleDesc: 'Member (DB Design)' },
  { id: '6', name: 'Kumar', email: 'kumar@gmail.com', roleDesc: 'Member' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.getMe();
        setUser(userData);
        setToken(storedToken);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        authStorage.clearToken();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login({ email, password });
      authStorage.setToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    setIsLoading(true);
    try {
      const response = await api.register({ name, email, password, confirmPassword });
      authStorage.setToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authStorage.clearToken();
    setToken(null);
    setUser(null);
  };

  const demoSwitch = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await api.demoSwitch(email);
      authStorage.setToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDemoDatabase = async () => {
    setIsLoading(true);
    try {
      await api.resetDemo();
      // Reload current session
      if (user) {
        await demoSwitch(user.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        demoSwitch,
        resetDemoDatabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
