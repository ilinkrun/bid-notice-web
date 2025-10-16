'use client';

import { useState, useEffect } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div
          className={cn(
            "transition-all duration-300 flex-shrink-0",
            isMobile
              ? "fixed inset-y-0 left-0 z-50"
              : "relative",
            isMobile && sidebarCollapsed && "-translate-x-full",
            !isMobile && sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        </div>

        {/* Mobile overlay */}
        {isMobile && !sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main content */}
        <div
          className={cn(
            "flex-1 min-h-screen transition-all duration-300",
            isMobile ? "w-full" : "flex-1"
          )}
        >
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}