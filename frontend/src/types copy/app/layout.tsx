import type { Metadata } from 'next';
import './globals.css';
import './themes.css';
import { RootLayoutClient } from '@/components/layouts/RootLayoutClient';

export const metadata: Metadata = {
  title: 'ILE - 입찰공고 관리 시스템',
  description: '입찰공고 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <RootLayoutClient>
        {children}
      </RootLayoutClient>
    </html>
  );
}
