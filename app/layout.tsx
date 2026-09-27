import type { Metadata } from 'next'

import '@fontsource/zen-kaku-gothic-new/400.css'
import '@fontsource/zen-kaku-gothic-new/500.css'
import '@fontsource/zen-kaku-gothic-new/700.css'

import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: '推活記録',
  description:
    'ライブやイベントの予定・思い出を記録するアプリ',
  applicationName: '推活記録',
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
