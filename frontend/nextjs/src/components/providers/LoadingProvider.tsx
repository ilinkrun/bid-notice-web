'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { DataLoadingProvider, useDataLoading } from './DataLoadingProvider';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

function LoadingOverlay() {
  const { isLoading } = useLoading();
  const { isDataLoading } = useDataLoading();
  
  // 네비게이션 로딩 또는 데이터 로딩 중일 때 표시
  const shouldShowLoading = isLoading || isDataLoading;
  
  if (!shouldShowLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-base font-medium text-card-foreground">
          {isDataLoading ? '데이터를 불러오는 중입니다...' : '페이지를 불러오는 중입니다...'}
        </p>
      </div>
    </div>
  );
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      <DataLoadingProvider>
        <LoadingOverlay />
        {children}
      </DataLoadingProvider>
    </LoadingContext.Provider>
  );
} 