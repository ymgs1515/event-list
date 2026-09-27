import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '推活ログ',
        short_name: '推活ログ',
        description:
            'ライブやイベントの予定・思い出を記録するアプリ',
        start_url: '/',
        display: 'standalone',
        background_color: '#eeeeee',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
