'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';

const VALIDATE_TOKEN_QUERY = gql`
  query ValidateToken($token: String!) {
    validateToken(token: $token) {
      user {
        id
        email
        name
        role
        department
        avatar
        isActive
        createdAt
        lastLoginAt
      }
      success
      message
    }
  }
`;

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [validateToken] = useLazyQuery(VALIDATE_TOKEN_QUERY, {
    client: getClient(),
    onCompleted: (data) => {
      if (data.validateToken.success && data.validateToken.user) {
        setUser(data.validateToken.user);
      } else {
        // 토큰이 유효하지 않으면 로그아웃 처리
        handleLogout();
      }
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Token validation error:', error);
      handleLogout();
      setIsLoading(false);
    }
  });

  // 로그아웃 처리
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
  };

  // 초기 로드 시 localStorage에서 사용자 정보 복원
  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('auth-user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        
        // 토큰 유효성 검증
        validateToken({ variables: { token: storedToken } });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        handleLogout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [validateToken]);

  // 로그인 함수
  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('auth-token', authToken);
    localStorage.setItem('auth-user', JSON.stringify(userData));
  };

  // 로그아웃 함수
  const logout = () => {
    handleLogout();
  };

  // 역할 확인 함수
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  // 여러 역할 중 하나라도 가지고 있는지 확인
  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    token,
    login,
    logout,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 역할 기반 컴포넌트 래퍼
interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 인증 필요 컴포넌트 래퍼
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}