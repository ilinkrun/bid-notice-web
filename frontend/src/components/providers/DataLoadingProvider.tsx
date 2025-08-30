'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface DataLoadingContextType {
  isDataLoading: boolean;
  setDataLoading: (loading: boolean) => void;
  markDataLoaded: () => void;
}

const DataLoadingContext = createContext<DataLoadingContextType | undefined>(undefined);

export function useDataLoading() {
  const context = useContext(DataLoadingContext);
  if (context === undefined) {
    throw new Error('useDataLoading must be used within a DataLoadingProvider');
  }
  return context;
}

interface DataLoadingProviderProps {
  children: ReactNode;
}

export function DataLoadingProvider({ children }: DataLoadingProviderProps) {
  const [isDataLoading, setIsDataLoading] = useState(false);

  const setDataLoading = useCallback((loading: boolean) => {
    setIsDataLoading(loading);
  }, []);

  const markDataLoaded = useCallback(() => {
    // 짧은 지연 후 로딩 해제 (DOM 렌더링 완료 대기)
    setTimeout(() => {
      setIsDataLoading(false);
    }, 150);
  }, []);

  return (
    <DataLoadingContext.Provider value={{ 
      isDataLoading, 
      setDataLoading, 
      markDataLoaded 
    }}>
      {children}
    </DataLoadingContext.Provider>
  );
}