'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionBoundaryProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export const PermissionBoundary: React.FC<PermissionBoundaryProps> = ({
  children,
  roles,
  permissions,
  requireAll = false,
  fallback,
  showMessage = true
}) => {
  const { userPermissions, canView, hasRole } = usePermissions();

  if (!userPermissions) {
    return fallback || null;
  }

  // 역할 기반 권한 확인
  if (roles && roles.length > 0) {
    const roleCheck = requireAll 
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role));
    
    if (!roleCheck) {
      return fallback || (showMessage ? (
        <div className="p-4 text-center text-color-primary-muted-foreground">
          <p>이 기능을 사용할 권한이 없습니다.</p>
        </div>
      ) : null);
    }
  }

  // 권한 기반 확인
  if (permissions && permissions.length > 0) {
    const permissionCheck = requireAll
      ? permissions.every(permission => canView(permission))
      : permissions.some(permission => canView(permission));

    if (!permissionCheck) {
      return fallback || (showMessage ? (
        <div className="p-4 text-center text-color-primary-muted-foreground">
          <p>이 기능을 사용할 권한이 없습니다.</p>
        </div>
      ) : null);
    }
  }

  return <>{children}</>;
};

// 편의를 위한 특화된 컴포넌트들

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback }) => (
  <PermissionBoundary roles={['admin']} fallback={fallback}>
    {children}
  </PermissionBoundary>
);

interface ManagerOrAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ManagerOrAdmin: React.FC<ManagerOrAdminProps> = ({ children, fallback }) => (
  <PermissionBoundary roles={['manager', 'admin']} fallback={fallback}>
    {children}
  </PermissionBoundary>
);

interface AuthenticatedOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthenticatedOnly: React.FC<AuthenticatedOnlyProps> = ({ children, fallback }) => (
  <PermissionBoundary roles={['user', 'manager', 'admin']} fallback={fallback}>
    {children}
  </PermissionBoundary>
);

interface ViewPermissionProps {
  resource: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ViewPermission: React.FC<ViewPermissionProps> = ({ resource, children, fallback }) => (
  <PermissionBoundary permissions={[resource]} fallback={fallback}>
    {children}
  </PermissionBoundary>
);

// 조건부 렌더링을 위한 훅
export const useConditionalRender = () => {
  const { hasRole, canView, canEdit, canDelete, canAdmin } = usePermissions();

  const renderIf = {
    hasRole: (role: string | string[], component: React.ReactNode) => {
      const roles = Array.isArray(role) ? role : [role];
      return roles.some(r => hasRole(r)) ? component : null;
    },
    canView: (resource: string, component: React.ReactNode) => 
      canView(resource) ? component : null,
    canEdit: (resource: string, component: React.ReactNode) => 
      canEdit(resource) ? component : null,
    canDelete: (resource: string, component: React.ReactNode) => 
      canDelete(resource) ? component : null,
    canAdmin: (resource: string, component: React.ReactNode) => 
      canAdmin(resource) ? component : null,
  };

  return { renderIf, hasRole, canView, canEdit, canDelete, canAdmin };
};