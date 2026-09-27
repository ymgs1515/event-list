'use client'

import {
    FormEvent,
    useEffect,
    useState,
    useLayoutEffect,
    useRef
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Funnel,
    Search,
    SquarePlus,
    ChevronRight,
} from 'lucide-react'
import styles from './EventListClient.module.css'
import {
    restoreListPositionIfNeeded,
    saveListPosition,
} from '@/lib/listNavigation'
import AppHeaderPortal from '@/components/AppHeaderPortal'

type Artist = {
    name: string
    sort_order: number
}

type Hashtag = {
    tag: string
    sort_order: number
}

type SetlistItem = {
    title: string
    detail: string | null
    position: number
}

type SearchAlias = {
    canonical_text: string
    alias_text: string
}

type EventItem = {
    id: string
    event_date: string
    doors_time?: string | null
    main_visual_path?: string | null
    main_visual_position_x?: number | null
    main_visual_position_y?: number | null
    title: string
    venue: string | null
    seat_block_row: string | null
    seat_number: string | null
    start_time: string | null
    ticket_price: string | null
    memo: string | null
    created_at: string
    event_artists: Artist[]
    event_hashtags: Hashtag[]
    setlist_items: SetlistItem[]
}

type Props = {
    events: EventItem[]
    selectedTags: string[]
    selectedKeyword: string
    searchAliases: SearchAlias[]
    mode: 'scheduled' | 'archive'
    featuredEvent?: EventItem | null
    featuredImageUrl?: string | null
}

function EventTitle({
    title,
    isExpanded,
}: {
    title: string
    isExpanded: boolean
}) {
    const textRef =
        useRef<HTMLSpanElement>(null)

    const [isSingleLine, setIsSingleLine] =
        useState(false)

    useLayoutEffect(() => {
        const element = textRef.current

        if (!element) return

        const checkLineCount = () => {
            const style =
                window.getComputedStyle(element)

            const lineHeight =
                parseFloat(style.lineHeight)

            const height =
                element.getBoundingClientRect().height

            setIsSingleLine(
                height <= lineHeight * 1.5
            )
        }

        checkLineCount()

        const observer =
            new ResizeObserver(checkLineCount)

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [title])

    return (
        <div
            className={[
                styles.eventTitle,
                isExpanded && isSingleLine
                    ? styles.eventTitleExpandedSingle
                    : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <span
                ref={textRef}
                className={styles.eventTitleText}
            >
                {title}
            </span>
        </div>
    )
}

export default function EventListClient({
    events,
    selectedTags,
    selectedKeyword,
    searchAliases,
    mode,
    featuredEvent = null,
    featuredImageUrl = null,
}: Props) {
    const basePath =
        mode === 'archive'
            ? '/archive'
            : '/'

    const router = useRouter()

    useEffect(() => {
        restoreListPositionIfNeeded()
    }, [])

    const [
        showFilter,
        setShowFilter,
    ] = useState(false)

    const [
        draftTags,
        setDraftTags,
    ] = useState<string[]>([])

    const [
        showSearch,
        setShowSearch,
    ] = useState(false)

    const [
        draftKeyword,
        setDraftKeyword,
    ] = useState('')

    const [
        expandedEventId,
        setExpandedEventId,
    ] = useState<string | null>(null)

    const tagCounts =
        new Map<string, number>()

    for (const event of events) {
        for (
            const hashtag of
            event.event_hashtags ?? []
        ) {
            tagCounts.set(
                hashtag.tag,
                (tagCounts.get(hashtag.tag) ?? 0) + 1
            )
        }
    }

    const allTags = Array.from(
        tagCounts.entries()
    )
        .sort(
            ([tagA, countA], [tagB, countB]) =>
                countB - countA ||
                tagA.localeCompare(tagB, 'ja')
        )
        .map(([tag]) => tag)

    function normalizeSearchText(
        value: string
    ) {
        return value
            .trim()
            .toLocaleLowerCase()
    }

    function createKeywordCandidates(
        value: string
    ) {
        const keyword =
            normalizeSearchText(value)

        if (!keyword) {
            return []
        }

        const candidates =
            new Set<string>()

        candidates.add(keyword)

        const matchedCanonicalNames =
            new Set<string>()

        for (const alias of searchAliases) {
            const canonical =
                normalizeSearchText(
                    alias.canonical_text
                )

            const alternative =
                normalizeSearchText(
                    alias.alias_text
                )

            const matchesAlias =
                canonical.includes(keyword) ||
                alternative.includes(keyword) ||
                keyword.includes(canonical) ||
                keyword.includes(alternative)

            if (matchesAlias) {
                matchedCanonicalNames.add(
                    canonical
                )
            }
        }

        for (const alias of searchAliases) {
            const canonical =
                normalizeSearchText(
                    alias.canonical_text
                )

            const alternative =
                normalizeSearchText(
                    alias.alias_text
                )

            if (
                matchedCanonicalNames.has(
                    canonical
                )
            ) {
                candidates.add(canonical)
                candidates.add(alternative)
            }
        }

        return Array.from(candidates)
    }

    function createDateSearchText(
        eventDate: string
    ) {
        const [
            year,
            paddedMonth,
            paddedDay,
        ] = eventDate.split('-')

        if (
            !year ||
            !paddedMonth ||
            !paddedDay
        ) {
            return eventDate
        }

        const month =
            String(Number(paddedMonth))

        const day =
            String(Number(paddedDay))

        return [
            eventDate,
            `${year}.${paddedMonth}.${paddedDay}`,
            `${year}/${paddedMonth}/${paddedDay}`,
            `${year}.${month}.${day}`,
            `${year}/${month}/${day}`,
            `${year}年${month}月${day}日`,
            `${year}年${month}月`,
            `${year}年`,
            `${month}月${day}日`,
        ].join(' ')
    }

    function createEventSearchText(
        event: EventItem
    ) {
        const artists =
            (event.event_artists ?? [])
                .map(
                    (artist) => artist.name
                )
                .join(' ')

        const hashtags =
            (event.event_hashtags ?? [])
                .map(
                    (hashtag) => hashtag.tag
                )
                .join(' ')

        const setlist =
            (event.setlist_items ?? [])
                .flatMap((item) => [
                    item.title,
                    item.detail ?? '',
                ])
                .join(' ')

        const dateText =
            createDateSearchText(
                event.event_date
            )

        return normalizeSearchText(
            [
                dateText,
                event.title,
                event.venue ?? '',
                event.seat_block_row ?? '',
                event.seat_number ?? '',
                event.ticket_price ?? '',
                event.memo ?? '',
                artists,
                hashtags,
                setlist,
            ].join(' ')
        )
    }

    function matchesTagFilter(
        event: EventItem
    ) {
        if (selectedTags.length === 0) {
            return true
        }

        return (
            event.event_hashtags ?? []
        ).some((hashtag) =>
            selectedTags.includes(
                hashtag.tag
            )
        )
    }

    function matchesKeyword(
        event: EventItem
    ) {
        const keywordCandidates =
            createKeywordCandidates(
                selectedKeyword
            )

        if (
            keywordCandidates.length === 0
        ) {
            return true
        }

        const searchText =
            createEventSearchText(event)

        return keywordCandidates.some(
            (candidate) =>
                searchText.includes(candidate)
        )
    }

    const filteredEvents =
        events.filter(
            (event) =>
                matchesTagFilter(event) &&
                matchesKeyword(event)
        )

    const yearGroups = new Map<
        string,
        EventItem[]
    >()

    for (const event of filteredEvents) {
        const year =
            event.event_date.slice(0, 4)

        const currentEvents =
            yearGroups.get(year) ?? []

        currentEvents.push(event)

        yearGroups.set(
            year,
            currentEvents
        )
    }

    function buildHomeUrl(
        tags: string[],
        keyword: string
    ) {
        const params =
            new URLSearchParams()

        for (const tag of tags) {
            params.append(
                'tag',
                tag
            )
        }

        const trimmedKeyword =
            keyword.trim()

        if (trimmedKeyword) {
            params.set(
                'q',
                trimmedKeyword
            )
        }

        const query =
            params.toString()

        if (!query) {
            return basePath
        }

        return `${basePath}?${query}`
    }

    function openFilter() {
        if (showFilter) {
            setShowFilter(false)
            return
        }

        setDraftTags([
            ...selectedTags,
        ])

        setShowSearch(false)
        setShowFilter(true)
    }

    function toggleTag(tag: string) {
        if (draftTags.includes(tag)) {
            setDraftTags(
                draftTags.filter(
                    (currentTag) =>
                        currentTag !== tag
                )
            )

            return
        }

        setDraftTags([
            ...draftTags,
            tag,
        ])
    }

    function clearFilter() {
        setDraftTags([])
    }

    function applyFilter() {
        const homeUrl =
            buildHomeUrl(
                draftTags,
                selectedKeyword
            )

        setShowFilter(false)

        router.replace(homeUrl)
    }

    function openSearch() {
        if (showSearch) {
            setShowSearch(false)
            return
        }

        setDraftKeyword(
            selectedKeyword
        )

        setShowFilter(false)
        setShowSearch(true)
    }

    function clearSearch() {
        setDraftKeyword('')
    }

    function applySearch(
        event?: FormEvent
    ) {
        event?.preventDefault()

        const homeUrl =
            buildHomeUrl(
                selectedTags,
                draftKeyword
            )

        setShowSearch(false)

        router.replace(homeUrl)
    }

    function formatEventDate(
        date: string
    ) {
        return date.replaceAll(
            '-',
            '.'
        )
    }

    function formatEventDateWithWeekday(
        date: string
    ) {
        const [year, month, day] =
            date.split('-').map(Number)

        if (!year || !month || !day) {
            return date
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

        const weekday =
            weekdays[
            new Date(
                year,
                month - 1,
                day
            ).getDay()
            ]

        return `${year}.${String(month).padStart(
            2,
            '0'
        )}.${String(day).padStart(
            2,
            '0'
        )} (${weekday})`
    }

    const returnTo =
        buildHomeUrl(
            selectedTags,
            selectedKeyword
        )

    const newEventUrl =
        `/events/new?returnTo=${encodeURIComponent(
            returnTo
        )}`

    return (
        <div className={styles.page}>
            <AppHeaderPortal>
                <h1
                    className={styles.title}
                >
                    {mode === 'scheduled'
                        ? 'これからの予定'
                        : '思い出'}
                </h1>

                <div
                    className={
                        styles.headerActions
                    }
                >
                    {mode === 'archive' && (
                        <>
                            <button
                                type="button"
                                aria-label="キーワード検索"
                                title="キーワード検索"
                                onClick={openSearch}
                                className={[
                                    styles.iconButton,
                                    selectedKeyword
                                        ? styles.iconButtonActive
                                        : '',
                                ].join(' ')}
                            >
                                <Search
                                    size={25}
                                    strokeWidth={2.2}
                                />

                                {selectedKeyword && (
                                    <span
                                        className={
                                            styles.activeDot
                                        }
                                    />
                                )}
                            </button>

                            <button
                                type="button"
                                aria-label="絞り込み"
                                title="絞り込み"
                                onClick={openFilter}
                                className={[
                                    styles.iconButton,
                                    selectedTags.length > 0
                                        ? styles.iconButtonActive
                                        : '',
                                ].join(' ')}
                            >
                                <Funnel
                                    size={25}
                                    strokeWidth={2.2}
                                />

                                {selectedTags.length > 0 && (
                                    <span
                                        className={
                                            styles.activeDot
                                        }
                                    />
                                )}
                            </button>
                        </>
                    )}

                    <Link
                        href={newEventUrl}
                        aria-label="新規イベント"
                        title="新規イベント"
                        className={
                            styles.iconLink
                        }
                    >
                        <SquarePlus
                            size={27}
                            strokeWidth={2.2}
                        />
                    </Link>

                    {mode === 'archive' && showSearch && (
                        <form
                            onSubmit={applySearch}
                            className={
                                styles.popup
                            }
                        >
                            <input
                                type="text"
                                autoFocus
                                placeholder="キーワードを入力"
                                value={draftKeyword}
                                onChange={(event) =>
                                    setDraftKeyword(
                                        event.target.value
                                    )
                                }
                                className={
                                    styles.searchInput
                                }
                            />

                            <div
                                className={
                                    styles.popupButtons
                                }
                            >
                                <button
                                    type="button"
                                    onClick={
                                        clearSearch
                                    }
                                    className={
                                        styles.popupButton
                                    }
                                >
                                    クリア
                                </button>

                                <button
                                    type="submit"
                                    className={
                                        styles.popupButton
                                    }
                                >
                                    検索
                                </button>
                            </div>
                        </form>
                    )}

                    {mode === 'archive' && showFilter && (
                        <div
                            className={
                                styles.popup
                            }
                        >
                            {allTags.length > 0 ? (
                                <>
                                    <div
                                        className={
                                            styles.tagList
                                        }
                                    >
                                        {allTags.map(
                                            (tag) => (
                                                <label
                                                    key={tag}
                                                    className={
                                                        styles.tagItem
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={draftTags.includes(
                                                            tag
                                                        )}
                                                        onChange={() =>
                                                            toggleTag(
                                                                tag
                                                            )
                                                        }
                                                    />

                                                    <span>
                                                        {tag}
                                                    </span>
                                                </label>
                                            )
                                        )}
                                    </div>

                                    <div
                                        className={
                                            styles.popupButtons
                                        }
                                    >
                                        <button
                                            type="button"
                                            onClick={
                                                clearFilter
                                            }
                                            className={
                                                styles.popupButton
                                            }
                                        >
                                            クリア
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                applyFilter
                                            }
                                            className={
                                                styles.popupButton
                                            }
                                        >
                                            絞り込み
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p>
                                    絞り込み可能なタグがありません。
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </AppHeaderPortal>

            {mode === 'scheduled' &&
                featuredEvent && (
                    <section
                        className={
                            styles.nextLiveSection
                        }
                    >
                        <Link
                            href={`/events/${featuredEvent.id}?returnTo=${encodeURIComponent(
                                '/'
                            )}`}
                            className={
                                styles.nextLiveCard
                            }
                            onClick={saveListPosition}
                        >
                            {featuredImageUrl && (
                                <div
                                    className={
                                        styles.nextLiveVisual
                                    }
                                >
                                    <img
                                        src={
                                            featuredImageUrl
                                        }
                                        alt={
                                            featuredEvent.title
                                        }
                                        style={{
                                            objectPosition:
                                                `${featuredEvent.main_visual_position_x ??
                                                50
                                                }% ${featuredEvent.main_visual_position_y ??
                                                50
                                                }%`,
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                className={
                                    styles.nextLiveBody
                                }
                            >
                                <div
                                    className={
                                        styles.nextLiveLabel
                                    }
                                >
                                    NEXT LIVE
                                </div>

                                <div
                                    className={
                                        styles.nextLiveTitle
                                    }
                                >
                                    {
                                        featuredEvent.title
                                    }
                                </div>

                                <div
                                    className={
                                        styles.nextLiveMeta
                                    }
                                >
                                    <span className={styles.nextLiveDate}>
                                        {featuredEvent.event_date.replaceAll(
                                            '-',
                                            '.'
                                        )}

                                        <span
                                            className={
                                                styles.nextLiveWeekday
                                            }
                                        >
                                            {' '}
                                            (
                                            {
                                                [
                                                    '日',
                                                    '月',
                                                    '火',
                                                    '水',
                                                    '木',
                                                    '金',
                                                    '土',
                                                ][
                                                new Date(
                                                    `${featuredEvent.event_date}T00:00:00`
                                                ).getDay()
                                                ]
                                            }
                                            )
                                        </span>
                                    </span>

                                    {featuredEvent.venue && (
                                        <span>
                                            {
                                                featuredEvent.venue
                                            }
                                        </span>
                                    )}
                                </div>

                                {(featuredEvent.doors_time ||
                                    featuredEvent.start_time) && (
                                        <div
                                            className={
                                                styles.nextLiveTime
                                            }
                                        >
                                            {featuredEvent.doors_time && (
                                                <div>
                                                    <span
                                                        className={
                                                            styles.nextLiveTimeLabel
                                                        }
                                                    >
                                                        開場
                                                    </span>

                                                    <span
                                                        className={
                                                            styles.nextLiveTimeValue
                                                        }
                                                    >
                                                        {featuredEvent.doors_time.slice(
                                                            0,
                                                            5
                                                        )}
                                                    </span>
                                                </div>
                                            )}

                                            {featuredEvent.start_time && (
                                                <div>
                                                    <span
                                                        className={
                                                            styles.nextLiveTimeLabel
                                                        }
                                                    >
                                                        開演
                                                    </span>

                                                    <span
                                                        className={
                                                            styles.nextLiveTimeValue
                                                        }
                                                    >
                                                        {featuredEvent.start_time.slice(
                                                            0,
                                                            5
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        </Link>
                    </section>
                )}

            <div
                className={styles.content}
            >
                {filteredEvents.length >
                    0 ? (
                    <>
                        {Array.from(
                            yearGroups.entries()
                        ).map(
                            ([
                                year,
                                yearEvents,
                            ]) => (
                                <section
                                    key={year}
                                    className={
                                        styles.yearSection
                                    }
                                >
                                    <h2
                                        className={
                                            styles.yearTitle
                                        }
                                    >
                                        - {year} -
                                    </h2>

                                    <div
                                        className={
                                            styles.eventList
                                        }
                                    >
                                        {yearEvents.map((event) => {
                                            const artists = [
                                                ...(event.event_artists ?? []),
                                            ].sort(
                                                (a, b) =>
                                                    a.sort_order - b.sort_order
                                            )

                                            const detailUrl =
                                                `/events/${event.id}` +
                                                `?returnTo=${encodeURIComponent(
                                                    returnTo
                                                )}`

                                            const isExpanded =
                                                expandedEventId === event.id

                                            return (
                                                <article
                                                    key={event.id}
                                                    className={styles.eventCard}
                                                >
                                                    <button
                                                        type="button"
                                                        className={styles.eventMain}
                                                        onClick={() =>
                                                            setExpandedEventId(
                                                                isExpanded
                                                                    ? null
                                                                    : event.id
                                                            )
                                                        }
                                                        aria-expanded={isExpanded}
                                                    >
                                                        <div
                                                            className={
                                                                styles.eventDate
                                                            }
                                                        >
                                                            {formatEventDate(
                                                                event.event_date
                                                            )}
                                                        </div>

                                                        <EventTitle
                                                            title={event.title}
                                                            isExpanded={isExpanded}
                                                        />
                                                    </button>

                                                    {isExpanded && (
                                                        <div
                                                            className={
                                                                styles.eventExpanded
                                                            }
                                                        >
                                                            {(event.venue ||
                                                                artists.length > 0) && (
                                                                    <div
                                                                        className={
                                                                            styles.eventDetails
                                                                        }
                                                                    >
                                                                        {event.venue && (
                                                                            <div
                                                                                className={
                                                                                    styles.detailRow
                                                                                }
                                                                            >
                                                                                <span
                                                                                    className={
                                                                                        styles.detailLabel
                                                                                    }
                                                                                >
                                                                                    Venue
                                                                                </span>

                                                                                <span
                                                                                    className={
                                                                                        styles.detailValue
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        event.venue
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {artists.length >
                                                                            0 && (
                                                                                <div
                                                                                    className={
                                                                                        styles.detailRow
                                                                                    }
                                                                                >
                                                                                    <span
                                                                                        className={
                                                                                            styles.detailLabel
                                                                                        }
                                                                                    >
                                                                                        Artist
                                                                                    </span>

                                                                                    <span
                                                                                        className={`${styles.detailValue} ${styles.artistList}`}
                                                                                    >
                                                                                        {artists.map(
                                                                                            (artist, index) => (
                                                                                                <span
                                                                                                    key={`${artist.name}-${index}`}
                                                                                                    className={
                                                                                                        styles.artistName
                                                                                                    }
                                                                                                >
                                                                                                    {artist.name}
                                                                                                    {index <
                                                                                                        artists.length - 1
                                                                                                        ? '、'
                                                                                                        : ''}
                                                                                                </span>
                                                                                            )
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                )}

                                                            <div
                                                                className={
                                                                    styles.eventActions
                                                                }
                                                            >
                                                                <Link
                                                                    href={detailUrl}
                                                                    className={
                                                                        styles.detailButton
                                                                    }
                                                                    aria-label="イベントを閲覧"
                                                                    title="閲覧"
                                                                    onClick={saveListPosition}
                                                                >
                                                                    <ChevronRight
                                                                        size={18}
                                                                        strokeWidth={1.8}
                                                                    />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}
                                                </article>
                                            )
                                        })}
                                    </div>
                                </section>
                            )
                        )}
                    </>
                ) : mode === 'scheduled' ? (
                    featuredEvent ? null : (
                        <p
                            className={styles.empty}
                        >
                            予定がありません
                        </p>
                    )
                ) : (
                    <p
                        className={styles.empty}
                    >
                        該当するイベントがありません。
                    </p>
                )}

            </div>
        </div>
    )
}

