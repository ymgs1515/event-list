'use client'

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    usePathname,
} from 'next/navigation'
import FooterNav from '@/components/FooterNav'

type DirtyContextType = {
    setPageDirty: (
        value: boolean
    ) => void
}

const DirtyContext =
    createContext<DirtyContextType | null>(
        null
    )

export function usePageDirty(
    isDirty: boolean
) {
    const context =
        useContext(DirtyContext)

    useEffect(() => {
        if (!context) {
            return
        }

        context.setPageDirty(isDirty)

        return () => {
            context.setPageDirty(false)
        }
    }, [
        context,
        isDirty,
    ])
}

type Props = {
    children: ReactNode
}

export default function AppShell({
    children,
}: Props) {
    const pathname = usePathname()

    const [
        pageDirty,
        setPageDirty,
    ] = useState(false)

    const dirtyContextValue =
        useMemo(
            () => ({
                setPageDirty,
            }),
            []
        )

    const isEventDetailPage =
        pathname.startsWith('/events/') &&
        pathname !== '/events/new'

    const hasSharedHeader =
        pathname !== '/login' &&
        pathname !== '/~offline' &&
        (
            pathname === '/' ||
            pathname === '/archive' ||
            pathname === '/events/new' ||
            pathname.startsWith('/settings') ||
            isEventDetailPage
        )

    const hasFooter =
        pathname !== '/login' &&
        pathname !== '/~offline'

    let current:
        | 'archive'
        | 'scheduled'
        | 'settings'
        | undefined

    if (pathname === '/') {
        current = 'scheduled'
    } else if (
        pathname.startsWith('/archive')
    ) {
        current = 'archive'
    } else if (
        pathname.startsWith('/settings')
    ) {
        current = 'settings'
    }

    return (
        <DirtyContext.Provider
            value={dirtyContextValue}
        >
            <header
                id="app-header"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,

                    display: hasSharedHeader
                        ? 'flex'
                        : 'none',

                    alignItems: 'center',
                    justifyContent: 'space-between',

                    width: '100%',
                    maxWidth: '480px',
                    height: '58px',
                    margin: '0 auto',
                    padding: '0 16px',

                    background:
                        'rgba(255,255,255,0.96)',

                    borderBottom:
                        '1px solid #dddddd',

                    boxSizing: 'border-box',
                }}
            />

            {children}

            {hasFooter && (
                <div id="app-footer">
                    <FooterNav
                        current={current}
                        isDirty={pageDirty}
                    />
                </div>
            )}
        </DirtyContext.Provider>
    )
}

