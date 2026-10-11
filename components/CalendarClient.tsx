'use client'

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import Link from 'next/link'
import {
    ChevronRight,
    MapPin,
    SquarePlus,
} from 'lucide-react'
import styles from './CalendarClient.module.css'
import {
    restoreListPositionIfNeeded,
    saveListPosition,
} from '@/lib/listNavigation'

type Artist = {
    name: string
    sort_order: number
}

type CalendarEvent = {
    id: string
    event_date: string
    title: string
    subtitle: string | null
    venue: string | null
    start_time: string | null
    event_artists: Artist[]
}

type Props = {
    events: CalendarEvent[]
    todayJst: string
    initialDate: string
}

const weekdays = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
]

function addMonths(
    monthKey: string,
    amount: number
) {
    const [
        year,
        month,
    ] = monthKey
        .split('-')
        .map(Number)

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1 + amount,
                1
            )
        )

    return [
        date.getUTCFullYear(),
        String(
            date.getUTCMonth() + 1
        ).padStart(2, '0'),
    ].join('-')
}

function getMonthDistance(
    startMonth: string,
    endMonth: string
) {
    const [
        startYear,
        startMonthNumber,
    ] = startMonth
        .split('-')
        .map(Number)

    const [
        endYear,
        endMonthNumber,
    ] = endMonth
        .split('-')
        .map(Number)

    return (
        (endYear - startYear) * 12 +
        endMonthNumber -
        startMonthNumber
    )
}

function getMonthDays(
    monthKey: string
) {
    const [
        year,
        month,
    ] = monthKey
        .split('-')
        .map(Number)

    const firstWeekday =
        new Date(
            Date.UTC(
                year,
                month - 1,
                1
            )
        ).getUTCDay()

    const daysInMonth =
        new Date(
            Date.UTC(
                year,
                month,
                0
            )
        ).getUTCDate()

    const cells:
        Array<string | null> = []

    for (
        let index = 0;
        index < firstWeekday;
        index++
    ) {
        cells.push(null)
    }

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {
        cells.push(
            `${monthKey}-${String(
                day
            ).padStart(2, '0')}`
        )
    }

    while (
        cells.length % 7 !== 0
    ) {
        cells.push(null)
    }

    return cells
}

function formatMonthTitle(
    monthKey: string
) {
    const [
        year,
        month,
    ] = monthKey
        .split('-')
        .map(Number)

    return `${year}年${month}月`
}

function formatEventDate(
    date: string
) {
    return date.replaceAll(
        '-',
        '.'
    )
}

export default function CalendarClient({
    events,
    todayJst,
    initialDate,
}: Props) {
    const [
        selectedDate,
        setSelectedDate,
    ] = useState(
        initialDate
    )

    const targetMonthRef =
        useRef<HTMLElement | null>(
            null
        )

    useEffect(() => {
        restoreListPositionIfNeeded()

        const frameId =
            window.requestAnimationFrame(
                () => {
                    targetMonthRef.current
                        ?.scrollIntoView({
                            block: 'start',
                            behavior: 'auto',
                        })
                }
            )

        return () => {
            window.cancelAnimationFrame(
                frameId
            )
        }
    }, [])

    const eventsByDate =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    CalendarEvent[]
                >()

            for (const event of events) {
                const current =
                    map.get(
                        event.event_date
                    ) ?? []

                current.push(event)

                map.set(
                    event.event_date,
                    current
                )
            }

            return map
        }, [events])

    const monthKeys =
        useMemo(() => {
            const currentMonth =
                todayJst.slice(0, 7)

            const eventMonths =
                events.map(
                    (event) =>
                        event.event_date.slice(
                            0,
                            7
                        )
                )

            const earliestEventMonth =
                eventMonths[0] ??
                currentMonth

            const latestEventMonth =
                eventMonths[
                    eventMonths.length - 1
                ] ??
                currentMonth

            const startMonth = [
                addMonths(
                    currentMonth,
                    -12
                ),
                earliestEventMonth,
            ].sort()[0]

            const endCandidates = [
                addMonths(
                    currentMonth,
                    12
                ),
                latestEventMonth,
            ].sort()

            const endMonth =
                endCandidates[
                    endCandidates.length - 1
                ] ??
                currentMonth

            const count =
                getMonthDistance(
                    startMonth,
                    endMonth
                ) + 1

            return Array.from(
                {
                    length:
                        Math.max(
                            count,
                            1
                        ),
                },
                (_, index) =>
                    addMonths(
                        startMonth,
                        index
                    )
            )
        }, [
            events,
            todayJst,
        ])

    const selectedMonth =
        selectedDate.slice(
            0,
            7
        )

    const selectedReturnTo =
        `/calendar?date=${encodeURIComponent(
            selectedDate
        )}`

    const newEventUrl =
        `/events/new?returnTo=${encodeURIComponent(
            selectedReturnTo
        )}`

    function selectDate(
        date: string
    ) {
        setSelectedDate(
            date
        )

        const url =
            `/calendar?date=${encodeURIComponent(
                date
            )}`

        window.history.replaceState(
            window.history.state,
            '',
            url
        )
    }

    return (
        <main
            className={
                styles.page
            }
        >
            <header
                className={
                    styles.header
                }
            >
                <h1
                    className={
                        styles.title
                    }
                >
                    カレンダー
                </h1>

                <Link
                    href={
                        newEventUrl
                    }
                    aria-label="新規イベント"
                    title="新規イベント"
                    className={
                        styles.addButton
                    }
                >
                    <SquarePlus
                        size={27}
                        strokeWidth={2.2}
                    />
                </Link>
            </header>

            <div
                className={
                    styles.monthList
                }
            >
                {monthKeys.map(
                    (monthKey) => {
                        const cells =
                            getMonthDays(
                                monthKey
                            )

                        const selectedEvents =
                            monthKey ===
                                selectedMonth
                                ? eventsByDate.get(
                                    selectedDate
                                ) ?? []
                                : []

                        return (
                            <section
                                key={
                                    monthKey
                                }
                                ref={
                                    monthKey ===
                                        selectedMonth
                                        ? targetMonthRef
                                        : undefined
                                }
                                className={
                                    styles.monthSection
                                }
                            >
                                <h2
                                    className={
                                        styles.monthTitle
                                    }
                                >
                                    {formatMonthTitle(
                                        monthKey
                                    )}
                                </h2>

                                <div
                                    className={
                                        styles.weekdayRow
                                    }
                                >
                                    {weekdays.map(
                                        (
                                            weekday,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    weekday
                                                }
                                                className={[
                                                    styles.weekday,
                                                    index === 0
                                                        ? styles.sunday
                                                        : '',
                                                    index === 6
                                                        ? styles.saturday
                                                        : '',
                                                ]
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .join(
                                                        ' '
                                                    )}
                                            >
                                                {weekday}
                                            </div>
                                        )
                                    )}
                                </div>

                                <div
                                    className={
                                        styles.calendarGrid
                                    }
                                >
                                    {cells.map(
                                        (
                                            date,
                                            index
                                        ) => {
                                            if (!date) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                        className={
                                                            styles.emptyDay
                                                        }
                                                    />
                                                )
                                            }

                                            const dayNumber =
                                                Number(
                                                    date.slice(
                                                        -2
                                                    )
                                                )

                                            const weekdayIndex =
                                                index % 7

                                            const dayEvents =
                                                eventsByDate.get(
                                                    date
                                                ) ?? []

                                            const eventCount =
                                                dayEvents.length

                                            const isSelected =
                                                date ===
                                                selectedDate

                                            const isToday =
                                                date ===
                                                todayJst

                                            return (
                                                <button
                                                    key={
                                                        date
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        selectDate(
                                                            date
                                                        )
                                                    }
                                                    className={[
                                                        styles.dayButton,
                                                        weekdayIndex === 0
                                                            ? styles.sunday
                                                            : '',
                                                        weekdayIndex === 6
                                                            ? styles.saturday
                                                            : '',
                                                        isSelected
                                                            ? styles.daySelected
                                                            : '',
                                                        isToday
                                                            ? styles.dayToday
                                                            : '',
                                                    ]
                                                        .filter(
                                                            Boolean
                                                        )
                                                        .join(
                                                            ' '
                                                        )}
                                                >
                                                    <span
                                                        className={
                                                            styles.dayNumber
                                                        }
                                                    >
                                                        {dayNumber}
                                                    </span>

                                                    <span
                                                        className={
                                                            styles.eventDotArea
                                                        }
                                                    >
                                                        {Array.from(
                                                            {
                                                                length:
                                                                    eventCount,
                                                            }
                                                        ).map(
                                                            (
                                                                _,
                                                                dotIndex
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        dotIndex
                                                                    }
                                                                    className={
                                                                        styles.eventDot
                                                                    }
                                                                />
                                                            )
                                                        )}
                                                    </span>
                                                </button>
                                            )
                                        }
                                    )}
                                </div>

                                {monthKey ===
                                    selectedMonth &&
                                    selectedEvents.length >
                                    0 && (
                                        <div
                                            className={
                                                styles.eventList
                                            }
                                        >
                                            {selectedEvents.map(
                                                (
                                                    event
                                                ) => {
                                                    const artists =
                                                        [
                                                            ...(event.event_artists ??
                                                                []),
                                                        ].sort(
                                                            (
                                                                a,
                                                                b
                                                            ) =>
                                                                a.sort_order -
                                                                b.sort_order
                                                        )

                                                    const detailUrl =
                                                        `/events/${event.id}?returnTo=${encodeURIComponent(
                                                            selectedReturnTo
                                                        )}`

                                                    return (
                                                        <Link
                                                            key={
                                                                event.id
                                                            }
                                                            href={
                                                                detailUrl
                                                            }
                                                            onClick={
                                                                saveListPosition
                                                            }
                                                            className={
                                                                styles.eventCard
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles.eventCardDate
                                                                }
                                                            >
                                                                {formatEventDate(
                                                                    event.event_date
                                                                )}

                                                                {event.start_time && (
                                                                    <span
                                                                        className={
                                                                            styles.eventCardTime
                                                                        }
                                                                    >
                                                                        {event.start_time.slice(
                                                                            0,
                                                                            5
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div
                                                                className={
                                                                    styles.eventCardBody
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.eventCardTitle
                                                                    }
                                                                >
                                                                    {event.title}

                                                                    {event.subtitle && (
                                                                        <>
                                                                            {' '}
                                                                            {event.subtitle}
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {(event.venue ||
                                                                    artists.length >
                                                                    0) && (
                                                                        <div
                                                                            className={
                                                                                styles.eventCardMeta
                                                                            }
                                                                        >
                                                                            {event.venue && (
                                                                                <div
                                                                                    className={
                                                                                        styles.eventCardVenue
                                                                                    }
                                                                                >
                                                                                    <MapPin
                                                                                        size={11}
                                                                                        strokeWidth={2}
                                                                                        aria-hidden="true"
                                                                                    />

                                                                                    <span>
                                                                                        {event.venue}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {artists.length >
                                                                                0 && (
                                                                                    <div
                                                                                        className={
                                                                                            styles.eventCardArtists
                                                                                        }
                                                                                    >
                                                                                        {artists
                                                                                            .map(
                                                                                                (
                                                                                                    artist
                                                                                                ) =>
                                                                                                    artist.name
                                                                                            )
                                                                                            .join(
                                                                                                '、'
                                                                                            )}
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            <ChevronRight
                                                                size={18}
                                                                strokeWidth={1.8}
                                                                className={
                                                                    styles.eventCardArrow
                                                                }
                                                            />
                                                        </Link>
                                                    )
                                                }
                                            )}
                                        </div>
                                    )}
                            </section>
                        )
                    }
                )}
            </div>
        </main>
    )
}
