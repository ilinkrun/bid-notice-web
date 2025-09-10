'use client';

import { Inter } from 'next/font/google';
import { Header } from '@/components/layouts/Header';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import Footer from '@/components/layouts/Footer';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { Suspense } from 'react';
import Loading from '@/app/loading';
import { UnifiedLoadingProvider } from '@/components/providers/UnifiedLoadingProvider';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <body className={cn(inter.className, 'min-h-screen flex flex-col bg-blue-100')}>
      <ApolloWrapper>
        <AuthProvider>
          <UnifiedLoadingProvider>
            <Header 
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
            <main className="relative">
              {isMobileMenuOpen && (
                <div className="fixed inset-0 top-14 bg-black/25 backdrop-blur-sm z-40 md:hidden" />
              )}
              <Suspense fallback={<Loading />}>
                {children}
              </Suspense>
            </main>
            <div className="h-4"></div>
          </UnifiedLoadingProvider>
        </AuthProvider>
      </ApolloWrapper>
      <Footer />
    </body>
  );
} 