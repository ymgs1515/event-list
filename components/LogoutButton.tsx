'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/components/ConfirmDialog'

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

            <ConfirmDialog
                open={showLogoutConfirm}
                message={
                    errorMessage
                        ? errorMessage
                        : loggingOut
                            ? 'ログアウトしています...'
                            : isDirty
                                ? '未保存データを破棄してログアウトしますか？'
                                : 'ログアウトしますか？'
                }
                onCancel={() => {
                    if (loggingOut) {
                        return
                    }

                    setShowLogoutConfirm(false)
                    setErrorMessage('')
                }}
                onConfirm={() => {
                    if (loggingOut) {
                        return
                    }

                    void confirmLogout()
                }}
            />
        </>
    )
}


