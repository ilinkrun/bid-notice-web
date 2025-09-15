import type { Metadata } from 'next';
import './globals.css';
import './themes.css';
import { RootLayoutClient } from '@/components/layouts/RootLayoutClient';

export const metadata: Metadata = {
  title: 'IBW - ilmac|link 입찰 관리 웹앱',
  description: '일맥|링크 입찰 관리 웹앱',
  icons: {
    icon: "/icons8-star-16.png",
  },
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
