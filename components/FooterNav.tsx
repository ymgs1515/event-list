'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
    CalendarDays,
    House,
    NotebookDot,
    Settings,
} from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
    clearListPositionRestore,
} from '@/lib/listNavigation'

type Props = {
    current?:
    | 'archive'
    | 'scheduled'
    | 'calendar'
    | 'settings'

    isDirty?: boolean
}

export default function FooterNav({
    current,
    isDirty = false,
}: Props) {
    const router = useRouter()
    const pathname = usePathname()

    const effectiveCurrent =
        pathname.startsWith('/calendar')
            ? 'calendar'
            : current

    useEffect(() => {
        router.prefetch('/')
        router.prefetch('/calendar')
        router.prefetch('/archive')
        router.prefetch('/settings')
    }, [router])

    const [
        pendingHref,
        setPendingHref,
    ] = useState<string | null>(null)

    function moveTo(href: string) {
        clearListPositionRestore()

        router.push(
            href,
            {
                scroll: true,
            }
        )

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto',
        })
    }

    function requestNavigation(
        href: string
    ) {
        if (isDirty) {
            setPendingHref(href)
            return
        }

        moveTo(href)
    }

    function cancelNavigation() {
        setPendingHref(null)
    }

    function confirmNavigation() {
        if (!pendingHref) {
            return
        }

        const href =
            pendingHref

        setPendingHref(null)

        moveTo(href)
    }

    function itemStyle(
        item:
            | 'archive'
            | 'scheduled'
            | 'calendar'
            | 'settings'
    ) {
        const isActive =
            effectiveCurrent === item

        return {
            flex: 1,

            height: '64px',

            display: 'flex',

            flexDirection:
                'column' as const,

            alignItems:
                'center' as const,

            justifyContent:
                'center' as const,

            gap: '3px',

            padding: 0,

            color: isActive
                ? '#222222'
                : '#999999',

            fontSize: '9.5px',

            fontWeight: isActive
                ? 700
                : 400,

            background:
                'transparent',

            border: 0,

            cursor: 'pointer',
        }
    }

    return (
        <>
            <nav
                aria-label="メインメニュー"
                style={{
                    position: 'fixed',

                    left: '50%',
                    bottom: 0,

                    transform:
                        'translateX(-50%)',

                    zIndex: 200,

                    display: 'flex',

                    width: '100%',
                    maxWidth: '480px',

                    minHeight: '64px',

                    background:
                        'rgba(255,255,255,0.97)',

                    borderTop:
                        '1px solid #dddddd',

                    paddingBottom:
                        'env(safe-area-inset-bottom)',
                }}
            >
                <button
                    type="button"
                    onClick={() =>
                        requestNavigation(
                            '/'
                        )
                    }
                    aria-current={
                        effectiveCurrent ===
                            'scheduled'
                            ? 'page'
                            : undefined
                    }
                    style={itemStyle(
                        'scheduled'
                    )}
                >
                    <House
                        size={24}
                        strokeWidth={
                            effectiveCurrent ===
                                'scheduled'
                                ? 2.4
                                : 1.8
                        }
                    />

                    <span>
                        ホーム
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        requestNavigation(
                            '/calendar'
                        )
                    }
                    aria-current={
                        effectiveCurrent ===
                            'calendar'
                            ? 'page'
                            : undefined
                    }
                    style={itemStyle(
                        'calendar'
                    )}
                >
                    <CalendarDays
                        size={23}
                        strokeWidth={
                            effectiveCurrent ===
                                'calendar'
                                ? 2.4
                                : 1.8
                        }
                    />

                    <span>
                        カレンダー
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        requestNavigation(
                            '/archive'
                        )
                    }
                    aria-current={
                        effectiveCurrent ===
                            'archive'
                            ? 'page'
                            : undefined
                    }
                    style={itemStyle(
                        'archive'
                    )}
                >
                    <NotebookDot
                        size={23}
                        strokeWidth={
                            effectiveCurrent ===
                                'archive'
                                ? 2.4
                                : 1.8
                        }
                    />

                    <span>
                        思い出
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        requestNavigation(
                            '/settings'
                        )
                    }
                    aria-current={
                        effectiveCurrent ===
                            'settings'
                            ? 'page'
                            : undefined
                    }
                    style={itemStyle(
                        'settings'
                    )}
                >
                    <Settings
                        size={23}
                        strokeWidth={
                            effectiveCurrent ===
                                'settings'
                                ? 2.4
                                : 1.8
                        }
                    />

                    <span>
                        設定
                    </span>
                </button>
            </nav>

            <ConfirmDialog
                open={
                    pendingHref !== null
                }
                onCancel={
                    cancelNavigation
                }
                onConfirm={
                    confirmNavigation
                }
            />
        </>
    )
}

