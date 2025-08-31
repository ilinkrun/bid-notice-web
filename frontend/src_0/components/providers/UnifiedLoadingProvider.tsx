'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface UnifiedLoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  finishLoading: () => void;
  setCustomMessage: (message: string) => void;
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
    
    // 중복 호출을 방지하기 위해 약간의 지연 후 해제
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setCustomMessage('');
    }, 100);
  }, []);

  const setMessage = useCallback((message: string) => {
    setCustomMessage(message);
  }, []);

  return (
    <UnifiedLoadingContext.Provider value={{ 
      isLoading, 
      startLoading, 
      finishLoading,
      setCustomMessage: setMessage
    }}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-medium text-gray-700">
              {customMessage || '페이지를 불러오는 중입니다...'}
            </p>
          </div>
        </div>
      )}
      {children}
    </UnifiedLoadingContext.Provider>
  );
}