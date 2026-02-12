import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BLUWEAR 연계고용 감면 계산기',
  description: '장애인고용부담금 연계고용 감면 시뮬레이터',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
