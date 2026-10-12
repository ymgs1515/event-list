import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalendarClient from '@/components/CalendarClient'
import { getJapaneseHolidayDates } from '@/lib/japaneseHolidays'

type CalendarPageProps = {
    searchParams: Promise<{
        date?: string | string[]
    }>
}

function getTodayJst() {
    const parts =
        new Intl.DateTimeFormat(
            'en-CA',
            {
                timeZone: 'Asia/Tokyo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }
        ).formatToParts(
            new Date()
        )

    const year =
        parts.find(
            (part) =>
                part.type === 'year'
        )?.value ?? ''

    const month =
        parts.find(
            (part) =>
                part.type === 'month'
        )?.value ?? ''

    const day =
        parts.find(
            (part) =>
                part.type === 'day'
        )?.value ?? ''

    return `${year}-${month}-${day}`
}

export default async function CalendarPage({
    searchParams,
}: CalendarPageProps) {
    const supabase =
        await createClient()

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

    const {
        data: events,
        error,
    } = await supabase
        .from('events')
        .select(`
            id,
            event_date,
            title,
            subtitle,
            is_tentative,
            venue,
            guests,
            start_time,
            event_artists (
                name,
                sort_order
            )
        `)
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

    if (error) {
        return (
            <main>
                <p>
                    イベントデータの取得に失敗しました。
                </p>

                <p>
                    {error.message}
                </p>
            </main>
        )
    }

    const holidayDates =
        await getJapaneseHolidayDates()

    const todayJst =
        getTodayJst()

    const dateParameter =
        params.date

    const requestedDate =
        Array.isArray(
            dateParameter
        )
            ? dateParameter[0] ?? ''
            : dateParameter ?? ''

    const initialDate =
        /^\d{4}-\d{2}-\d{2}$/.test(
            requestedDate
        )
            ? requestedDate
            : todayJst

    return (
        <CalendarClient
            events={
                events ?? []
            }
            holidayDates={
                holidayDates
            }
            todayJst={
                todayJst
            }
            initialDate={
                initialDate
            }
        />
    )
}
