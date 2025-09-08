'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface UnifiedLoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  finishLoading: () => void;
  setCustomMessage: (message: string) => void;
  showSkeleton: boolean;
  setShowSkeleton: (show: boolean) => void;
}

const UnifiedLoadingContext = createContext<UnifiedLoadingContextType | undefined>(undefined);

export function useUnifiedLoading() {
  const context = useContext(UnifiedLoadingContext);
  if (context === undefined) {
    throw new Error('useUnifiedLoading must be used within a UnifiedLoadingProvider');
  }
  return context;
}

interface UnifiedLoadingProviderProps {
  children: ReactNode;
}

export function UnifiedLoadingProvider({ children }: UnifiedLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startLoading = useCallback(() => {
    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(true);
  }, []);

  const finishLoading = useCallback(() => {
    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 로딩 완료
    setIsLoading(false);
    setCustomMessage('');
    setShowSkeleton(false);
  }, []);

  const setMessage = useCallback((message: string) => {
    setCustomMessage(message);
  }, []);

  const setSkeletonShow = useCallback((show: boolean) => {
    setShowSkeleton(show);
  }, []);

  return (
    <UnifiedLoadingContext.Provider value={{ 
      isLoading, 
      startLoading, 
      finishLoading,
      setCustomMessage: setMessage,
      showSkeleton,
      setShowSkeleton: setSkeletonShow
    }}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-medium text-gray-700">
              {customMessage || '페이지 로딩 중...'}
            </p>
          </div>
        </div>
      )}
      {children}
    </UnifiedLoadingContext.Provider>
  );
}