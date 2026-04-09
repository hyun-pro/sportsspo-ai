import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'PROTECH V1 - 상권분석 플랫폼 | 주식회사 프로브랜드',
  description: '데이터 기반 상권분석으로 성공적인 창업과 매장 운영을 지원합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
