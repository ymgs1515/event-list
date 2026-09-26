const POSITION_KEY =
    'event-list:list-position'

const RESTORE_KEY =
    'event-list:restore-position'

type SavedListPosition = {
    href: string
    scrollY: number
}

export function saveListPosition() {
    if (typeof window === 'undefined') {
        return
    }

    const data: SavedListPosition = {
        href:
            window.location.pathname +
            window.location.search,
        scrollY: window.scrollY,
    }

    sessionStorage.setItem(
        POSITION_KEY,
        JSON.stringify(data)
    )
}

export function requestListPositionRestore() {
    if (typeof window === 'undefined') {
        return
    }

    sessionStorage.setItem(
        RESTORE_KEY,
        'true'
    )
}

export function clearListPositionRestore() {
    if (typeof window === 'undefined') {
        return
    }

    sessionStorage.removeItem(
        POSITION_KEY
    )

    sessionStorage.removeItem(
        RESTORE_KEY
    )
}

export function restoreListPositionIfNeeded() {
    if (typeof window === 'undefined') {
        return
    }

    const shouldRestore =
        sessionStorage.getItem(
            RESTORE_KEY
        )

    if (shouldRestore !== 'true') {
        return
    }

    const saved =
        sessionStorage.getItem(
            POSITION_KEY
        )

    sessionStorage.removeItem(
        RESTORE_KEY
    )

    if (!saved) {
        return
    }

    try {
        const data =
            JSON.parse(
                saved
            ) as SavedListPosition

        const currentHref =
            window.location.pathname +
            window.location.search

        if (data.href !== currentHref) {
            return
        }

        /*
         * 一覧の描画が終わってから
         * スクロール位置を戻す
         */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: data.scrollY,
                    left: 0,
                    behavior: 'auto',
                })

                sessionStorage.removeItem(
                    POSITION_KEY
                )
            })
        })
    } catch {
        sessionStorage.removeItem(
            POSITION_KEY
        )
    }
}

