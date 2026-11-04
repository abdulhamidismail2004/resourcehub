import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@resourcehub/shared';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; displayName: string; institution?: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  hasRole: (allowed: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get<{ success: boolean; data: { user: User | null } }>('/api/auth/me');
        if (res.success && res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ success: boolean; data: { user: User; token: string } }>('/api/auth/login', {
      email,
      password,
    });

    if (res.data?.token) {
      localStorage.setItem('rh_token', res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
    institution?: string;
  }): Promise<User> => {
    const res = await api.post<{ success: boolean; data: { user: User; token: string } }>('/api/auth/register', data);

    if (res.data?.token) {
      localStorage.setItem('rh_token', res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Continue even if server responds with error
    }
    localStorage.removeItem('rh_token');
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  const hasRole = (allowed: UserRole[]): boolean => {
    if (!user) return false;
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
