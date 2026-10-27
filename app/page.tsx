import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventListClient from '@/components/EventListClient'
import {
  getMainVisualThumbnailPath,
} from '@/lib/image/mainVisualThumbnail'

type HomeProps = {
  searchParams: Promise<{
    tag?: string | string[]
    q?: string | string[]
  }>
}

export default async function Home({
  searchParams,
}: HomeProps) {
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

  const timeParts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }
    ).formatToParts(new Date())

  const currentMinutes =
    Number(
      timeParts.find(
        (part) => part.type === 'hour'
      )?.value ?? '0'
    ) * 60 +
    Number(
      timeParts.find(
        (part) => part.type === 'minute'
      )?.value ?? '0'
    )

  function getStartMinutes(
    startTime: string | null
  ) {
    if (!startTime) {
      return null
    }

    const [hour, minute] =
      startTime.slice(0, 5)
        .split(':')
        .map(Number)

    if (
      !Number.isFinite(hour) ||
      !Number.isFinite(minute)
    ) {
      return null
    }

    return hour * 60 + minute
  }

  /*
   * Supabase / ログイン確認
   */

  const supabase =
    await createClient()

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  /*
   * URLの検索条件
   */

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
                subtitle,
                is_tentative,
                venue,
                seat_block_row,
                seat_number,
                seat_type,
                doors_time,
                main_visual_path,
                main_visual_position_x,
                main_visual_position_y,
                start_time,
                ticket_price,
                memo,
                created_at,
                guests,
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
   * NEXT LIVE と通常一覧に分割
   */

  const scheduledEvents =
    (events ?? []).filter((event) => {
      if (event.event_date > todayJst) {
        return true
      }

      if (event.event_date < todayJst) {
        return false
      }

      const startMinutes =
        getStartMinutes(event.start_time)

      if (startMinutes === null) {
        return true
      }

      return startMinutes > currentMinutes
    })

  const nextEvent =
    scheduledEvents.find(
      (event) => !event.is_tentative
    ) ?? null

  const remainingEvents =
    scheduledEvents.filter(
      (event) => event.id !== nextEvent?.id
    )

  /*
   * NEXT LIVE の画像URL
   */

  let nextEventImageUrl:
    string | null = null

  let nextEventThumbnailMissing =
    false

  if (
    nextEvent?.main_visual_path
  ) {
    const thumbnailPath =
      getMainVisualThumbnailPath(
        nextEvent.main_visual_path
      )

    const slashIndex =
      thumbnailPath.lastIndexOf('/')

    const thumbnailDirectory =
      slashIndex >= 0
        ? thumbnailPath.slice(
          0,
          slashIndex
        )
        : ''

    const thumbnailFileName =
      slashIndex >= 0
        ? thumbnailPath.slice(
          slashIndex + 1
        )
        : thumbnailPath

    const {
      data: thumbnailFiles,
    } =
      await supabase.storage
        .from('event-images')
        .list(
          thumbnailDirectory,
          {
            limit: 1,
            search:
              thumbnailFileName,
          }
        )

    const hasThumbnail =
      (thumbnailFiles ?? [])
        .some(
          (file) =>
            file.name ===
            thumbnailFileName
        )

    const imagePath =
      hasThumbnail
        ? thumbnailPath
        : nextEvent.main_visual_path

    nextEventThumbnailMissing =
      !hasThumbnail

    const {
      data: signedImage,
    } =
      await supabase.storage
        .from('event-images')
        .createSignedUrl(
          imagePath,
          60 * 60
        )

    nextEventImageUrl =
      signedImage?.signedUrl ??
      null
  }

  /*
   * 表示
   */

  return (
    <main>
      <EventListClient
        events={remainingEvents}
        selectedTags={[]}
        selectedKeyword=""
        searchAliases={[]}
        mode="scheduled"
        featuredEvent={nextEvent}
        featuredImageUrl={nextEventImageUrl}
        featuredImagePath={
          nextEvent?.main_visual_path ??
          null
        }
        featuredThumbnailMissing={
          nextEventThumbnailMissing
        }
      />
    </main>
  )
}