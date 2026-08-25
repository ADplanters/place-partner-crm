import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PLACE PARTNER | 영업 관리 시스템',
  description: '플레이스 파트너의 계약 및 영업 관리 전용 CRM 시스템입니다.',
  openGraph: {
    title: 'PLACE PARTNER CRM',
    description: '플레이스 파트너 계약 및 영업 관리 시스템',
    url: 'https://place-partner-crm.vercel.app', // 실제 Vercel 배포 주소로 변경하셔도 됩니다.
    siteName: 'PLACE PARTNER',
    images: [
      {
        url: '/og-image.png', // public 폴더에 넣은 이미지 파일명과 똑같이 맞춰주세요.
        width: 1200,
        height: 630,
        alt: 'PLACE PARTNER CRM 배너 이미지',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}