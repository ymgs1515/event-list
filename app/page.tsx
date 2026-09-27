import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
      (part) => part.type === 'year'
    )?.value,
    todayParts.find(
      (part) => part.type === 'month'
    )?.value,
    todayParts.find(
      (part) => part.type === 'day'
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
        doors_time,
        main_visual_path,
        main_visual_position_x,
        main_visual_position_y,
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
      .gte(
        'event_date',
        todayJst
      )
      .order(
        'event_date',
        {
          ascending: true,
        }
      )
      .order(
        'start_time',
        {
          ascending: true,
          nullsFirst: false,
        }
      )
      .order(
        'created_at',
        {
          ascending: true,
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

  const scheduledEvents =
    events ?? []

  const nextEvent =
    scheduledEvents[0] ?? null

  const remainingEvents =
    scheduledEvents.slice(1)

  let nextEventImageUrl:
    string | null = null

  if (nextEvent?.main_visual_path) {
    const {
      data: signedImage,
    } =
      await supabase.storage
        .from('event-images')
        .createSignedUrl(
          nextEvent.main_visual_path,
          60 * 60
        )

    nextEventImageUrl =
      signedImage?.signedUrl ?? null
  }

  return (
    <main>
      {remainingEvents.length > 0 && (
        <EventListClient
          events={remainingEvents}
          selectedTags={[]}
          selectedKeyword=""
          searchAliases={[]}
          mode="scheduled"
          featuredEvent={nextEvent}
          featuredImageUrl={
            nextEventImageUrl
          }
        />
      )}
    </main>
  )
}

