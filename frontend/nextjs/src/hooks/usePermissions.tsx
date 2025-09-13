'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { getClient } from '@/lib/api/graphqlClient';

const CHECK_PAGE_ACCESS_QUERY = gql`
  query CheckPageAccess($path: String!, $token: String) {
    checkPageAccess(path: $path, token: $token) {
      hasAccess
      role
      message
      redirectTo
    }
  }
`;

const GET_USER_PERMISSIONS_QUERY = gql`
  query GetUserPermissions($token: String) {
    getUserPermissions(token: $token) {
      id
      role
      name
      description
      allowedPages
      deniedPages
      permissions {
        canView
        canEdit
        canDelete
        canAdmin
      }
    }
  }
`;

const GET_PERMISSIONS_QUERY = gql`
  query GetPermissions {
    permissions {
      id
      role
      name
      description
      allowedPages
      deniedPages
      permissions {
        canView
        canEdit
        canDelete
        canAdmin
      }
    }
  }
`;

interface Permission {
  id: string;
  role: string;
  name: string;
  description: string;
  allowedPages: string[];
  deniedPages: string[];
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canAdmin: string[];
  };
}

interface PageAccessResult {
  hasAccess: boolean;
  role: string;
  message: string;
  redirectTo?: string;
}

interface UsePermissionsReturn {
  userPermissions: Permission | null;
  allPermissions: Permission[];
  checkPageAccess: (path: string) => Promise<PageAccessResult>;
  canView: (resource: string) => boolean;
  canEdit: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canAdmin: (resource: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isLoading: boolean;
  error: any;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { token, user, isAuthenticated } = useAuth();
  const [userPermissions, setUserPermissions] = useState<Permission | null>(null);

  // 사용자 권한 조회 (로그인한 사용자만)
  const { data: userPermData, loading: userPermLoading, error: userPermError } = useQuery(
    GET_USER_PERMISSIONS_QUERY,
    {
      variables: { token },
      client: getClient(),
      skip: !isAuthenticated || !token
    }
  );

  useEffect(() => {
    if (userPermData?.getUserPermissions) {
      setUserPermissions(userPermData.getUserPermissions);
    }
  }, [userPermData]);

  // 모든 권한 조회
  const { data: allPermData, loading: allPermLoading, error: allPermError } = useQuery(
    GET_PERMISSIONS_QUERY,
    {
      client: getClient()
    }
  );

  // 페이지 접근 권한 확인을 위한 lazy query
  const [checkPageAccessQuery] = useLazyQuery(CHECK_PAGE_ACCESS_QUERY, {
    client: getClient()
  });

  // 페이지 접근 권한 확인 함수
  const checkPageAccess = useCallback(async (path: string): Promise<PageAccessResult> => {
    try {
      const { data } = await checkPageAccessQuery({
        variables: { path, token }
      });

      return data.checkPageAccess || {
        hasAccess: false,
        role: 'guest',
        message: '페이지 접근 권한을 확인할 수 없습니다.',
        redirectTo: '/login'
      };
    } catch (error) {
      console.error('Error checking page access:', error);
      return {
        hasAccess: false,
        role: 'guest',
        message: '페이지 접근 권한 확인 중 오류가 발생했습니다.',
        redirectTo: '/login'
      };
    }
  }, [checkPageAccessQuery, token]);

  // 리소스 접근 권한 확인 함수들
  const canView = useCallback((resource: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.canView.includes('*') || 
           userPermissions.permissions.canView.includes(resource);
  }, [userPermissions]);

  const canEdit = useCallback((resource: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.canEdit.includes('*') || 
           userPermissions.permissions.canEdit.includes(resource);
  }, [userPermissions]);

  const canDelete = useCallback((resource: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.canDelete.includes('*') || 
           userPermissions.permissions.canDelete.includes(resource);
  }, [userPermissions]);

  const canAdmin = useCallback((resource: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.canAdmin.includes('*') || 
           userPermissions.permissions.canAdmin.includes(resource);
  }, [userPermissions]);

  // 역할 확인 함수
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!userPermissions) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userPermissions.role);
  }, [userPermissions]);

  // 로그인하지 않은 사용자를 위한 guest 권한 설정
  useEffect(() => {
    if (!isAuthenticated && allPermData?.permissions) {
      const guestPermission = allPermData.permissions.find(p => p.role === 'guest');
      if (guestPermission) {
        setUserPermissions(guestPermission);
      }
    } else if (!isAuthenticated) {
      setUserPermissions(null);
    }
  }, [isAuthenticated, allPermData]);

  return {
    userPermissions,
    allPermissions: allPermData?.permissions || [],
    checkPageAccess,
    canView,
    canEdit,
    canDelete,
    canAdmin,
    hasRole,
    isLoading: (isAuthenticated && userPermLoading) || allPermLoading,
    error: userPermError || allPermError
  };
};

// 페이지 보호를 위한 HOC 컴포넌트
interface ProtectedPageProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback,
  redirectTo = '/login'
}) => {
  const { userPermissions, isLoading } = usePermissions();
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return null;
  }

  // 역할 기반 접근 제어
  if (allowedRoles && userPermissions) {
    if (!allowedRoles.includes(userPermissions.role)) {
      if (fallback) return <>{fallback}</>;
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
            <p className="text-muted-foreground">이 페이지에 접근할 권한이 없습니다.</p>
          </div>
        </div>
      );
    }
  }

  // 권한 기반 접근 제어
  if (requiredPermission && userPermissions) {
    const hasPermission = userPermissions.permissions.canView.includes('*') ||
                         userPermissions.permissions.canView.includes(requiredPermission);
    
    if (!hasPermission) {
      if (fallback) return <>{fallback}</>;
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
            <p className="text-muted-foreground">이 리소스에 접근할 권한이 없습니다.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};