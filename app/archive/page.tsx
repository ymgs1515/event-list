import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FooterNav from '@/components/FooterNav'
import EventListClient from '@/components/EventListClient'

type HomeProps = {
    searchParams: Promise<{
        tag?: string | string[]
        q?: string | string[]
    }>
}

export default async function Home({
    searchParams,
}: HomeProps) {
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

    const supabase =
        await createClient()

    const {
        data: { user },
    } =
        await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const params =
        await searchParams

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

    const {
        data: events,
        error,
    } =
        await supabase
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
            )

    const {
        data: searchAliases,
        error: searchAliasesError,
    } =
        await supabase
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
            )

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

    return (
        <main>
            <EventListClient
                events={events ?? []}
                selectedTags={selectedTags}
                selectedKeyword={selectedKeyword}
                searchAliases={searchAliases ?? []}
                mode="archive"
            />

            <FooterNav current="archive" />
        </main>
    )
}

