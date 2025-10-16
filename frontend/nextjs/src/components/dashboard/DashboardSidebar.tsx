'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  FileText,
  Users,
  Settings,
  Home,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building2,
  TrendingUp
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  adminOnly?: boolean;
  badge?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: <Home className="h-5 w-5" />,
    href: '/'
  },
  {
    id: 'statistics',
    label: '통계',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/statistics'
  },
  {
    id: 'notices',
    label: '입찰공고',
    icon: <FileText className="h-5 w-5" />,
    href: '/notices'
  },
  {
    id: 'boards',
    label: '게시판',
    icon: <Building2 className="h-5 w-5" />,
    href: '/channels/board'
  },
  {
    id: 'alerts',
    label: '알림',
    icon: <Bell className="h-5 w-5" />,
    href: '/alerts',
    badge: '3'
  },
  {
    id: 'errors',
    label: '에러 로그',
    icon: <AlertTriangle className="h-5 w-5" />,
    href: '/errors',
    adminOnly: true
  },
  {
    id: 'users',
    label: '사용자 관리',
    icon: <Users className="h-5 w-5" />,
    href: '/admin/users',
    adminOnly: true
  },
  {
    id: 'settings',
    label: '설정',
    icon: <Settings className="h-5 w-5" />,
    href: '/settings'
  }
];

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function DashboardSidebar({ collapsed = false, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { navigate } = useUnifiedNavigation();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  const handleMenuClick = (item: MenuItem) => {
    navigate(item.href);
  };

  return (
    <div
      className={cn(
        "h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              입찰공고 시스템
            </h1>
          )}
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAdmin ? '관리자' : '사용자'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center justify-center">
                {item.icon}
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>© 2024 입찰공고 시스템</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
}