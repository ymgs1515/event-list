import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventListClient from '@/components/EventListClient'

type ArchiveProps = {
    searchParams: Promise<{
        tag?: string | string[]
        q?: string | string[]
    }>
}

export default async function Archive({
    searchParams,
}: ArchiveProps) {
    /*
     * 今日の日付（JST）
     */

    const todayParts =
        new Intl.DateTimeFormat(
            'en-US',
            {
                timeZone: 'Asia/Tokyo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }
        ).formatToParts(new Date())

    const todayJst = [
        todayParts.find(
            (part) =>
                part.type === 'year'
        )?.value,

        todayParts.find(
            (part) =>
                part.type === 'month'
        )?.value,

        todayParts.find(
            (part) =>
                part.type === 'day'
        )?.value,
    ].join('-')

    /*
     * Supabase
     */

    const supabase =
        await createClient()

    /*
     * ログイン情報とURLパラメータを並列取得
     */

    const [
        authResult,
        params,
    ] = await Promise.all([
        supabase.auth.getUser(),
        searchParams,
    ])

    const {
        data: { user },
    } = authResult

    if (!user) {
        redirect('/login')
    }

    /*
     * URLの検索条件
     */

    const tagParameter =
        params.tag

    const selectedTags =
        Array.from(
            new Set(
                Array.isArray(
                    tagParameter
                )
                    ? tagParameter
                    : tagParameter
                        ? [tagParameter]
                        : []
            )
        )

    const keywordParameter =
        params.q

    const selectedKeyword =
        Array.isArray(
            keywordParameter
        )
            ? keywordParameter[0] ?? ''
            : keywordParameter ?? ''

    /*
     * イベントと検索別名辞書を並列取得
     */

    const [
        eventsResult,
        searchAliasesResult,
    ] = await Promise.all([
        supabase
            .from('events')
            .select(`
                id,
                event_date,
                title,
                venue,
                seat_block_row,
                seat_number,
                start_time,
                ticket_price,
                memo,
                created_at,
                event_artists (
                    name,
                    sort_order
                ),
                event_hashtags (
                    tag,
                    sort_order
                ),
                setlist_items (
                    title,
                    detail,
                    position
                )
            `)
            .lt(
                'event_date',
                todayJst
            )
            .order(
                'event_date',
                {
                    ascending: false,
                }
            )
            .order(
                'start_time',
                {
                    ascending: false,
                    nullsFirst: false,
                }
            )
            .order(
                'created_at',
                {
                    ascending: false,
                }
            ),

        supabase
            .from('search_aliases')
            .select(`
                canonical_text,
                alias_text
            `)
            .order(
                'canonical_text',
                {
                    ascending: true,
                }
            ),
    ])

    const {
        data: events,
        error,
    } = eventsResult

    const {
        data: searchAliases,
        error: searchAliasesError,
    } = searchAliasesResult

    /*
     * 取得エラー
     */

    if (
        error ||
        searchAliasesError
    ) {
        return (
            <main>
                <p>
                    イベントデータの取得に失敗しました。
                </p>

                <p>
                    {error?.message ??
                        searchAliasesError?.message}
                </p>
            </main>
        )
    }

    /*
     * 表示
     */

    return (
        <main>
            <EventListClient
                events={
                    events ?? []
                }
                selectedTags={
                    selectedTags
                }
                selectedKeyword={
                    selectedKeyword
                }
                searchAliases={
                    searchAliases ?? []
                }
                mode="archive"
            />
        </main>
    )
}
