'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
    isDirty?: boolean
    onDiscard?: () => void
}

export default function LogoutButton({
    isDirty = false,
    onDiscard,
}: Props) {
    const router = useRouter()
    const supabase = createClient()

    const [
        showLogoutConfirm,
        setShowLogoutConfirm,
    ] = useState(false)

    const [loggingOut, setLoggingOut] =
        useState(false)

    const [errorMessage, setErrorMessage] =
        useState('')

    async function confirmLogout() {
        setLoggingOut(true)
        setErrorMessage('')

        const { error } =
            await supabase.auth.signOut()

        if (error) {
            setErrorMessage(
                `ログアウトに失敗しました：${error.message}`
            )
            setLoggingOut(false)
            return
        }

        if (onDiscard) {
            onDiscard()
        }

        setShowLogoutConfirm(false)

        router.replace('/login')
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setErrorMessage('')
                    setShowLogoutConfirm(true)
                }}
            >
                ログアウト
            </button>

            {showLogoutConfirm && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background:
                            'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '24px',
                            width:
                                'calc(100% - 48px)',
                            maxWidth: '360px',
                        }}
                    >
                        <p>
                            {isDirty
                                ? '未保存データを破棄してログアウトしますか？'
                                : 'ログアウトしますか？'}
                        </p>

                        {errorMessage && (
                            <p>{errorMessage}</p>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent:
                                    'flex-end',
                                gap: '16px',
                            }}
                        >
                            <button
                                type="button"
                                disabled={loggingOut}
                                onClick={() =>
                                    setShowLogoutConfirm(
                                        false
                                    )
                                }
                            >
                                いいえ
                            </button>

                            <button
                                type="button"
                                disabled={loggingOut}
                                onClick={confirmLogout}
                            >
                                {loggingOut
                                    ? 'ログアウト中...'
                                    : 'はい'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}


