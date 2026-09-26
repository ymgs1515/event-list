'use client'

import {
    FormEvent,
    useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [email, setEmail] =
        useState('')

    const [password, setPassword] =
        useState('')

    const [
        errorMessage,
        setErrorMessage,
    ] = useState('')

    const [loading, setLoading] =
        useState(false)

    async function handleLogin(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault()

        setLoading(true)
        setErrorMessage('')

        const { error } =
            await supabase.auth
                .signInWithPassword({
                    email,
                    password,
                })

        if (error) {
            setErrorMessage(
                'メールアドレスまたはパスワードが正しくありません。'
            )

            setLoading(false)
            return
        }

        router.push('/')
        router.refresh()
    }

    return (
        <main className={styles.page}>
            <div
                className={
                    styles.loginArea
                }
            >
                <h1 className={styles.title}>
                    EVENT LIST
                </h1>

                <form
                    onSubmit={handleLogin}
                    className={styles.form}
                >
                    <div
                        className={styles.field}
                    >
                        <label
                            htmlFor="email"
                            className={
                                styles.label
                            }
                        >
                            メールアドレス
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            required
                            autoComplete="email"
                            className={
                                styles.input
                            }
                        />
                    </div>

                    <div
                        className={styles.field}
                    >
                        <label
                            htmlFor="password"
                            className={
                                styles.label
                            }
                        >
                            パスワード
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            required
                            autoComplete="current-password"
                            className={
                                styles.input
                            }
                        />
                    </div>

                    {errorMessage && (
                        <p
                            className={
                                styles.error
                            }
                        >
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={
                            styles.loginButton
                        }
                    >
                        {loading
                            ? 'ログイン中...'
                            : 'ログイン'}
                    </button>
                </form>
            </div>
        </main>
    )
}

