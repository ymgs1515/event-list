'use client'

import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../settings.module.css'
import {
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    X,
} from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import AppHeaderPortal from '@/components/AppHeaderPortal'

type SearchAlias = {
    id: string
    canonical_text: string
    alias_text: string
    created_at: string
}

export default function SearchAliasesPage() {
    const [aliases, setAliases] =
        useState<SearchAlias[]>([])

    const [loading, setLoading] =
        useState(true)

    const [
        errorMessage,
        setErrorMessage,
    ] = useState('')

    const [
        newCanonical,
        setNewCanonical,
    ] = useState('')

    const [
        newAlias,
        setNewAlias,
    ] = useState('')

    const [
        savingNewGroup,
        setSavingNewGroup,
    ] = useState(false)

    const [
        addAliasFor,
        setAddAliasFor,
    ] = useState<string | null>(null)

    const [
        aliasDraft,
        setAliasDraft,
    ] = useState('')

    const [
        savingAlias,
        setSavingAlias,
    ] = useState(false)

    const [
        showNewGroupForm,
        setShowNewGroupForm,
    ] = useState(false)

    const [
        expandedCanonical,
        setExpandedCanonical,
    ] = useState<string | null>(null)

    const [
        deleteGroupTarget,
        setDeleteGroupTarget,
    ] = useState<string | null>(null)

    const loadAliases =
        useCallback(async () => {
            setErrorMessage('')

            const supabase =
                createClient()

            const {
                data,
                error,
            } = await supabase
                .from('search_aliases')
                .select(`
          id,
          canonical_text,
          alias_text,
          created_at
        `)
                .order(
                    'canonical_text',
                    {
                        ascending: true,
                    }
                )
                .order(
                    'alias_text',
                    {
                        ascending: true,
                    }
                )

            if (error) {
                setErrorMessage(
                    '検索別名辞書の取得に失敗しました。'
                )

                setLoading(false)

                return
            }

            setAliases(data ?? [])
            setLoading(false)
        }, [])

    useEffect(() => {
        void loadAliases()
    }, [loadAliases])

    const aliasGroups =
        useMemo(() => {
            const groups =
                new Map<
                    string,
                    SearchAlias[]
                >()

            for (const alias of aliases) {
                const current =
                    groups.get(
                        alias.canonical_text
                    ) ?? []

                current.push(alias)

                groups.set(
                    alias.canonical_text,
                    current
                )
            }

            return Array.from(
                groups.entries()
            )
        }, [aliases])

    async function getCurrentUserId() {
        const supabase =
            createClient()

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser()

        if (error || !user) {
            throw new Error(
                'ユーザー情報を取得できませんでした。'
            )
        }

        return user.id
    }

    async function handleAddGroup(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault()

        const canonical =
            newCanonical.trim()

        const alias =
            newAlias.trim()

        if (!canonical || !alias) {
            setErrorMessage(
                '基準名と別名の両方を入力してください。'
            )

            return
        }

        if (
            canonical.toLocaleLowerCase() ===
            alias.toLocaleLowerCase()
        ) {
            setErrorMessage(
                '基準名と別名には異なる名称を入力してください。'
            )

            return
        }

        setSavingNewGroup(true)
        setErrorMessage('')

        try {
            const userId =
                await getCurrentUserId()

            const supabase =
                createClient()

            const { error } =
                await supabase
                    .from('search_aliases')
                    .insert({
                        user_id: userId,
                        canonical_text:
                            canonical,
                        alias_text: alias,
                    })

            if (error) {
                if (
                    error.code === '23505'
                ) {
                    setErrorMessage(
                        '同じ組み合わせがすでに登録されています。'
                    )
                } else {
                    setErrorMessage(
                        '検索別名の登録に失敗しました。'
                    )
                }

                return
            }

            setNewCanonical('')
            setNewAlias('')
            setShowNewGroupForm(false)

            await loadAliases()
        } catch {
            setErrorMessage(
                '検索別名の登録に失敗しました。'
            )
        } finally {
            setSavingNewGroup(false)
        }
    }

    async function handleAddAlias(
        canonical: string
    ) {
        const alias =
            aliasDraft.trim()

        if (!alias) {
            setErrorMessage(
                '追加する別名を入力してください。'
            )

            return
        }

        if (
            canonical
                .toLocaleLowerCase() ===
            alias.toLocaleLowerCase()
        ) {
            setErrorMessage(
                '基準名と同じ名称は別名として登録できません。'
            )

            return
        }

        setSavingAlias(true)
        setErrorMessage('')

        try {
            const userId =
                await getCurrentUserId()

            const supabase =
                createClient()

            const { error } =
                await supabase
                    .from('search_aliases')
                    .insert({
                        user_id: userId,
                        canonical_text:
                            canonical,
                        alias_text: alias,
                    })

            if (error) {
                if (
                    error.code === '23505'
                ) {
                    setErrorMessage(
                        '同じ組み合わせがすでに登録されています。'
                    )
                } else {
                    setErrorMessage(
                        '別名の追加に失敗しました。'
                    )
                }

                return
            }

            setAddAliasFor(null)
            setAliasDraft('')
            setExpandedCanonical(null)

            await loadAliases()

        } catch {
            setErrorMessage(
                '別名の追加に失敗しました。'
            )
        } finally {
            setSavingAlias(false)
        }
    }

    async function handleDeleteAlias(
        alias: SearchAlias
    ) {
        setErrorMessage('')

        const supabase =
            createClient()

        const { error } =
            await supabase
                .from('search_aliases')
                .delete()
                .eq('id', alias.id)

        if (error) {
            setErrorMessage(
                '別名の削除に失敗しました。'
            )

            return
        }

        await loadAliases()
    }

    async function handleDeleteGroup(
        canonical: string
    ) {
        setErrorMessage('')

        const supabase =
            createClient()

        const { error } =
            await supabase
                .from('search_aliases')
                .delete()
                .eq(
                    'canonical_text',
                    canonical
                )

        if (error) {
            setErrorMessage(
                '項目の削除に失敗しました。'
            )

            return
        }

        setAddAliasFor(null)
        setAliasDraft('')
        setDeleteGroupTarget(null)

        await loadAliases()
    }

    return (
        <main className={styles.page}>
            <AppHeaderPortal>
                <Link
                    href="/settings"
                    className={styles.headerBackButton}
                    aria-label="設定に戻る"
                    title="戻る"
                >
                    <ChevronLeft
                        size={28}
                        strokeWidth={2}
                    />
                </Link>

                <h1 className={styles.headerTitle}>
                    検索別名辞書
                </h1>
            </AppHeaderPortal>


            <div className={styles.content}>
                <p
                    className={
                        styles.description
                    }
                >
                    同じ名称として検索したい言葉を登録できます。
                </p>

                {errorMessage && (
                    <p
                        className={styles.error}
                    >
                        {errorMessage}
                    </p>
                )}

                <section
                    className={styles.section}
                >
                    <h2
                        className={
                            styles.sectionTitle
                        }
                    >
                        登録済み
                    </h2>

                    {loading ? (
                        <p
                            className={styles.empty}
                        >
                            読み込み中...
                        </p>
                    ) : aliasGroups.length ===
                        0 ? (
                        <p
                            className={styles.empty}
                        >
                            登録されている検索別名はありません。
                        </p>
                    ) : (
                        aliasGroups.map(
                            ([
                                canonical,
                                groupAliases,
                            ]) => {
                                const isExpanded =
                                    expandedCanonical ===
                                    canonical

                                return (
                                    <div
                                        key={canonical}
                                        className={
                                            styles.aliasCard
                                        }
                                    >
                                        <button
                                            type="button"
                                            className={
                                                styles.aliasToggle
                                            }
                                            onClick={() => {
                                                if (isExpanded) {
                                                    setExpandedCanonical(
                                                        null
                                                    )

                                                    setAddAliasFor(
                                                        null
                                                    )

                                                    setAliasDraft('')
                                                } else {
                                                    setExpandedCanonical(
                                                        canonical
                                                    )

                                                    setAddAliasFor(
                                                        null
                                                    )

                                                    setAliasDraft('')

                                                    setErrorMessage('')
                                                }
                                            }}
                                        >
                                            <strong
                                                className={
                                                    styles.aliasTitle
                                                }
                                            >
                                                {canonical}
                                            </strong>

                                            {isExpanded ? (
                                                <ChevronUp
                                                    size={18}
                                                    className={
                                                        styles.aliasToggleIcon
                                                    }
                                                />
                                            ) : (
                                                <ChevronDown
                                                    size={18}
                                                    className={
                                                        styles.aliasToggleIcon
                                                    }
                                                />
                                            )}

                                        </button>

                                        {isExpanded && (
                                            <div
                                                className={
                                                    styles.aliasBody
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.aliasList
                                                    }
                                                >
                                                    {groupAliases.map(
                                                        (alias) => (
                                                            <div
                                                                key={alias.id}
                                                                className={
                                                                    styles.aliasRow
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.aliasName
                                                                    }
                                                                >
                                                                    {
                                                                        alias.alias_text
                                                                    }
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    className={styles.aliasDeleteButton}
                                                                    onClick={() =>
                                                                        handleDeleteAlias(
                                                                            alias
                                                                        )}
                                                                    aria-label="別名を削除"
                                                                    title="別名を削除"
                                                                >
                                                                    <X size={18} strokeWidth={1.8} />
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                                {addAliasFor ===
                                                    canonical ? (
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                '12px',
                                                        }}
                                                    >
                                                        <input
                                                            type="text"
                                                            placeholder="別名を入力"
                                                            value={
                                                                aliasDraft
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setAliasDraft(
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                            className={
                                                                styles.input
                                                            }
                                                        />

                                                        <div
                                                            className={
                                                                styles.formButtons
                                                            }
                                                            style={{
                                                                marginTop:
                                                                    '8px',
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setAddAliasFor(
                                                                        null
                                                                    )
                                                                    setAliasDraft(
                                                                        ''
                                                                    )
                                                                }}
                                                                className={
                                                                    styles.formButton
                                                                }
                                                            >
                                                                キャンセル
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    savingAlias
                                                                }
                                                                onClick={() =>
                                                                    handleAddAlias(
                                                                        canonical
                                                                    )
                                                                }
                                                                className={
                                                                    styles.formButton
                                                                }
                                                            >
                                                                {savingAlias
                                                                    ? '追加中...'
                                                                    : '追加'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAddAliasFor(
                                                                canonical
                                                            )
                                                            setAliasDraft('')
                                                            setErrorMessage('')
                                                        }}
                                                        className={
                                                            styles.addAliasButton
                                                        }
                                                    >
                                                        ＋ 別名を追加
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeleteGroupTarget(
                                                            canonical
                                                        )
                                                    }
                                                    className={
                                                        styles.deleteItemButton
                                                    }
                                                >
                                                    項目を削除
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        )

                    )}
                </section>

                <section
                    className={styles.section}
                >
                    {!showNewGroupForm ? (
                        <button
                            type="button"
                            onClick={() => {
                                setShowNewGroupForm(
                                    true
                                )
                                setErrorMessage('')
                            }}
                            className={
                                styles.addItemButton
                            }
                        >
                            ＋ 項目を追加
                        </button>
                    ) : (
                        <form
                            onSubmit={
                                handleAddGroup
                            }
                            className={
                                styles.formCard
                            }
                        >
                            <div
                                className={
                                    styles.field
                                }
                            >
                                <label
                                    className={
                                        styles.fieldLabel
                                    }
                                >
                                    基準名
                                </label>

                                <input
                                    type="text"
                                    placeholder="例：ベルーナドーム"
                                    value={
                                        newCanonical
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setNewCanonical(
                                            event.target
                                                .value
                                        )
                                    }
                                    className={
                                        styles.input
                                    }
                                />
                            </div>

                            <div
                                className={
                                    styles.field
                                }
                            >
                                <label
                                    className={
                                        styles.fieldLabel
                                    }
                                >
                                    別名
                                </label>

                                <input
                                    type="text"
                                    placeholder="例：メットライフドーム"
                                    value={newAlias}
                                    onChange={(
                                        event
                                    ) =>
                                        setNewAlias(
                                            event.target
                                                .value
                                        )
                                    }
                                    className={
                                        styles.input
                                    }
                                />
                            </div>

                            <div
                                className={
                                    styles.formButtons
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewGroupForm(
                                            false
                                        )
                                        setNewCanonical('')
                                        setNewAlias('')
                                        setErrorMessage('')
                                    }}
                                    className={
                                        styles.formButton
                                    }
                                >
                                    キャンセル
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        savingNewGroup
                                    }
                                    className={
                                        styles.formButton
                                    }
                                >
                                    {savingNewGroup
                                        ? '追加中...'
                                        : '追加'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </div>

            <ConfirmDialog
                open={deleteGroupTarget !== null}
                message={
                    deleteGroupTarget
                        ? `「${deleteGroupTarget}」と、その別名をすべて削除しますか？`
                        : ''
                }
                onCancel={() =>
                    setDeleteGroupTarget(null)
                }
                onConfirm={() => {
                    if (!deleteGroupTarget) {
                        return
                    }

                    void handleDeleteGroup(
                        deleteGroupTarget
                    )
                }}
            />
        </main>
    )
}



