import type {
    PrecacheEntry,
    SerwistGlobalConfig,
} from 'serwist'
import {
    NetworkOnly,
    Serwist,
} from 'serwist'

declare global {
    interface WorkerGlobalScope
        extends SerwistGlobalConfig {
        __SW_MANIFEST:
        | (PrecacheEntry | string)[]
        | undefined
    }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
    precacheEntries:
        self.__SW_MANIFEST,

    precacheOptions: {
        cleanupOutdatedCaches: true,
    },

    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,

    /*
     * ページはキャッシュしない。
     * オンライン時は常にネットワークから取得する。
     */
    runtimeCaching: [
        {
            matcher: ({ request }) =>
                request.mode === 'navigate',
            handler: new NetworkOnly(),
        },
    ],

    /*
     * ページ取得に失敗した場合だけ
     * オフライン画面を表示する。
     */
    fallbacks: {
        entries: [
            {
                url: '/offline.html',
                matcher({ request }) {
                    return (
                        request.destination ===
                        'document'
                    )
                },
            },
        ],
    },
})

serwist.addEventListeners()
