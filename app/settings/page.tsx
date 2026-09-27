import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import styles from './settings.module.css'
import AppHeaderPortal from '@/components/AppHeaderPortal'

export default function SettingsPage() {
    return (
        <main className={styles.page}>
            <AppHeaderPortal>
                <h1 className={styles.headerTitle}>
                    設定
                </h1>
            </AppHeaderPortal>

            <div className={styles.content}>
                <section
                    className={styles.section}
                >
                    <h2
                        className={
                            styles.sectionTitle
                        }
                    >
                        検索
                    </h2>

                    <div
                        className={
                            styles.menuCard
                        }
                    >
                        <Link
                            href="/settings/search-aliases"
                            className={
                                styles.menuLink
                            }
                        >
                            <span>
                                検索別名辞書
                            </span>

                            <ChevronRight
                                size={18}
                                className={
                                    styles.menuArrow
                                }
                            />
                        </Link>
                    </div>
                </section>

                <section
                    className={styles.section}
                >
                    <h2
                        className={
                            styles.sectionTitle
                        }
                    >
                        アカウント
                    </h2>

                    <div
                        className={
                            styles.menuCard
                        }
                    >
                        <div
                            className={
                                styles.accountRow
                            }
                        >
                            <LogoutButton />
                        </div>
                    </div>
                </section>
            </div>

        </main>
    )
}

