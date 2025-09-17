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
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PageGuard } from '@/components/auth/PageGuard';

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn(inter.className, 'min-h-screen flex flex-col bg-background')}>
      <ThemeProvider>
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
                  <PageGuard>
                    {children}
                  </PageGuard>
                </Suspense>
              </main>
            </UnifiedLoadingProvider>
          </AuthProvider>
        </ApolloWrapper>
        <Footer />
      </ThemeProvider>
    </div>
  );
} 