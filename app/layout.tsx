import type {
  Metadata,
  Viewport,
} from 'next'

import '@fontsource/zen-kaku-gothic-new/400.css'
import '@fontsource/zen-kaku-gothic-new/500.css'
import '@fontsource/zen-kaku-gothic-new/700.css'

import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: '推活ログ',
  description:
    'ライブやイベントの予定・思い出を記録するアプリ',
  applicationName: '推活ログ',

  icons: {
    apple: '/icons/apple-touch-icon.png',
  },

  appleWebApp: {
    capable: true,
    title: '推活ログ',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
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
