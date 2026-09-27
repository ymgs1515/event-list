'use client'

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useParams, useRouter, useSearchParams, } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image/compress'
import FooterNav from '@/components/FooterNav'
import { ChevronLeft, Pencil, Save } from 'lucide-react'
import styles from '../EventForm.module.css'
import MainVisualFrame from '@/components/MainVisualFrame'
import ImageViewer from '@/components/ImageViewer'
import DeleteEventButton from '@/components/DeleteEventButton'
import {
    requestListPositionRestore,
} from '@/lib/listNavigation'
import ConfirmDialog from '@/components/ConfirmDialog'

const supabase = createClient()

type SetlistItem = {
    id: string
    displayLabel: string
    title: string
    detail: string
    note: string
}

type ExistingPhoto = {
    id: string
    photo_type: 'official' | 'personal'
    storage_path: string
    sort_order: number
    previewUrl: string
}

type NewPhoto = {
    id: string
    file: File
    previewUrl: string
}

type EditSnapshot = {
    eventDate: string
    title: string
    mainVisualPositionX: number
    mainVisualPositionY: number
    seatBlockRow: string
    seatNumber: string
    venue: string
    doorsTime: string
    startTime: string
    ticketPrice: string
    memo: string
    officialUrl: string
    setlistItems: {
        displayLabel: string
        title: string
        detail: string
        note: string
    }[]
    artists: string[]
    hashtags: string[]
}

export default function EventPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()

    const eventId = params.id as string

    const returnToParameter =
        searchParams.get('returnTo')

    const returnTo =
        returnToParameter &&
            returnToParameter.startsWith('/')
            ? returnToParameter
            : '/'

    const [
        initialSnapshot,
        setInitialSnapshot,
    ] = useState<EditSnapshot | null>(null)

    const [eventDate, setEventDate] = useState('')
    const [title, setTitle] = useState('')
    const titleDisplayRef =
        useRef<HTMLDivElement | null>(null)

    const [
        isMultilineTitle,
        setIsMultilineTitle,
    ] = useState(false)

    const [mainVisualPath, setMainVisualPath] = useState<string | null>(null)
    const [mainVisualUrl, setMainVisualUrl] = useState<string | null>(null)

    const [newMainVisual, setNewMainVisual] =
        useState<File | null>(null)

    const [
        newMainVisualPreviewUrl,
        setNewMainVisualPreviewUrl,
    ] = useState<string | null>(null)

    const [
        removeMainVisual,
        setRemoveMainVisual,
    ] = useState(false)

    const [
        mainVisualPositionX,
        setMainVisualPositionX,
    ] = useState(50)

    const [
        mainVisualPositionY,
        setMainVisualPositionY,
    ] = useState(50)

    const [
        newMainVisualPositionX,
        setNewMainVisualPositionX,
    ] = useState(50)

    const [
        newMainVisualPositionY,
        setNewMainVisualPositionY,
    ] = useState(50)

    const [officialPhotos, setOfficialPhotos] = useState<ExistingPhoto[]>([])
    const [personalPhotos, setPersonalPhotos] = useState<ExistingPhoto[]>([])

    const [newOfficialPhotos, setNewOfficialPhotos] =
        useState<NewPhoto[]>([])

    const [newPersonalPhotos, setNewPersonalPhotos] =
        useState<NewPhoto[]>([])

    const [deletedPhotoIds, setDeletedPhotoIds] =
        useState<string[]>([])

    const [
        viewerPhoto,
        setViewerPhoto,
    ] = useState<{
        src: string
        alt: string
    } | null>(null)

    const [seatBlockRow, setSeatBlockRow] = useState('')
    const [seatNumber, setSeatNumber] = useState('')
    const [venue, setVenue] = useState('')
    const [doorsTime, setDoorsTime] = useState('')
    const [startTime, setStartTime] = useState('')
    const [ticketPrice, setTicketPrice] = useState('')

    const [setlistItems, setSetlistItems] = useState<SetlistItem[]>([])

    const [memo, setMemo] = useState('')
    const [officialUrl, setOfficialUrl] = useState('')

    const [artists, setArtists] = useState<string[]>([])
    const [artistInput, setArtistInput] = useState('')

    const [hashtags, setHashtags] = useState<string[]>([])
    const [hashtagInput, setHashtagInput] = useState('')

    const [isEditing, setIsEditing] = useState(false)

    const [
        reloadKey,
        setReloadKey,
    ] = useState(0)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const [
        showBackConfirmDialog,
        setShowBackConfirmDialog,
    ] = useState(false)

    useEffect(() => {
        async function loadEvent() {
            setLoading(true)
            setErrorMessage('')

            const { data: eventData, error: eventError } =
                await supabase
                    .from('events')
                    .select(`
            id,
            event_date,
            title,
            seat_block_row,
            seat_number,
            venue,
            doors_time,
            start_time,
            ticket_price,
            memo,
            official_url,
            main_visual_path,
            main_visual_position_x,
            main_visual_position_y
          `)
                    .eq('id', eventId)
                    .single()

            if (eventError || !eventData) {
                setErrorMessage(
                    'イベント情報を取得できませんでした。'
                )
                setLoading(false)
                return
            }

            setEventDate(eventData.event_date ?? '')
            setTitle(eventData.title ?? '')

            setMainVisualPositionX(
                eventData.main_visual_position_x ?? 50
            )

            setMainVisualPositionY(
                eventData.main_visual_position_y ?? 50
            )
            setSeatBlockRow(eventData.seat_block_row ?? '')
            setSeatNumber(eventData.seat_number ?? '')
            setVenue(eventData.venue ?? '')

            setDoorsTime(
                eventData.doors_time
                    ? eventData.doors_time.slice(0, 5)
                    : ''
            )

            setStartTime(
                eventData.start_time
                    ? eventData.start_time.slice(0, 5)
                    : ''
            )

            setTicketPrice(eventData.ticket_price ?? '')
            setMemo(eventData.memo ?? '')
            setOfficialUrl(eventData.official_url ?? '')
            setMainVisualPath(eventData.main_visual_path ?? null)

            if (eventData.main_visual_path) {
                const { data: signedData, error: signedError } =
                    await supabase.storage
                        .from('event-images')
                        .createSignedUrl(eventData.main_visual_path, 3600)

                if (signedError) {
                    setErrorMessage(
                        `MAIN VISUALの取得に失敗しました：${signedError.message}`
                    )
                    setLoading(false)
                    return
                }

                setMainVisualUrl(signedData.signedUrl)

            } else {
                setMainVisualUrl(null)
            }

            const { data: setlistData, error: setlistError } =
                await supabase
                    .from('setlist_items')
                    .select('id, position, display_label, title, detail, note')
                    .eq('event_id', eventId)
                    .order('position', { ascending: true })

            if (setlistError) {
                setErrorMessage(
                    `SETLISTの取得に失敗しました：${setlistError.message}`
                )
                setLoading(false)
                return
            }

            setSetlistItems(
                (setlistData ?? []).map((item) => ({
                    id: item.id,
                    displayLabel: item.display_label ?? '',
                    title: item.title ?? '',
                    detail: item.detail ?? '',
                    note: item.note ?? '',
                }))
            )

            const { data: artistData, error: artistError } =
                await supabase
                    .from('event_artists')
                    .select('name, sort_order')
                    .eq('event_id', eventId)
                    .order('sort_order', { ascending: true })

            if (artistError) {
                setErrorMessage(
                    `ARTISTの取得に失敗しました：${artistError.message}`
                )
                setLoading(false)
                return
            }

            setArtists(
                (artistData ?? []).map((item) => item.name)
            )

            const { data: hashtagData, error: hashtagError } =
                await supabase
                    .from('event_hashtags')
                    .select('tag, sort_order')
                    .eq('event_id', eventId)
                    .order('sort_order', { ascending: true })

            if (hashtagError) {
                setErrorMessage(
                    `HASHTAGの取得に失敗しました：${hashtagError.message}`
                )
                setLoading(false)
                return
            }

            setHashtags(
                (hashtagData ?? []).map((item) => item.tag)
            )
            const { data: photoData, error: photoError } =
                await supabase
                    .from('event_photos')
                    .select(`
      id,
      photo_type,
      storage_path,
      sort_order
    `)
                    .eq('event_id', eventId)
                    .order('sort_order', { ascending: true })

            if (photoError) {
                setErrorMessage(
                    `PHOTOの取得に失敗しました：${photoError.message}`
                )
                setLoading(false)
                return
            }

            const loadedPhotos: ExistingPhoto[] = []

            for (const photo of photoData ?? []) {
                const { data: signedData, error: signedError } =
                    await supabase.storage
                        .from('event-images')
                        .createSignedUrl(photo.storage_path, 3600)

                if (signedError) {
                    setErrorMessage(
                        `PHOTO画像の取得に失敗しました：${signedError.message}`
                    )
                    setLoading(false)
                    return
                }

                loadedPhotos.push({
                    id: photo.id,
                    photo_type: photo.photo_type as 'official' | 'personal',
                    storage_path: photo.storage_path,
                    sort_order: photo.sort_order,
                    previewUrl: signedData.signedUrl,
                })
            }

            setOfficialPhotos(
                loadedPhotos.filter(
                    (photo) => photo.photo_type === 'official'
                )
            )

            setPersonalPhotos(
                loadedPhotos.filter(
                    (photo) => photo.photo_type === 'personal'
                )
            )
            setInitialSnapshot({
                eventDate: eventData.event_date ?? '',
                title: eventData.title ?? '',
                mainVisualPositionX:
                    eventData.main_visual_position_x ?? 50,
                mainVisualPositionY:
                    eventData.main_visual_position_y ?? 50,
                seatBlockRow:
                    eventData.seat_block_row ?? '',
                seatNumber:
                    eventData.seat_number ?? '',
                venue:
                    eventData.venue ?? '',
                doorsTime:
                    eventData.doors_time
                        ? eventData.doors_time.slice(0, 5)
                        : '',
                startTime:
                    eventData.start_time
                        ? eventData.start_time.slice(0, 5)
                        : '',
                ticketPrice:
                    eventData.ticket_price ?? '',
                memo:
                    eventData.memo ?? '',
                officialUrl:
                    eventData.official_url ?? '',

                setlistItems:
                    (setlistData ?? []).map(
                        (item) => ({
                            displayLabel: item.display_label ?? '',
                            title: item.title ?? '',
                            detail: item.detail ?? '',
                            note: item.note ?? '',
                        })
                    ),

                artists:
                    (artistData ?? []).map(
                        (item) => item.name
                    ),

                hashtags:
                    (hashtagData ?? []).map(
                        (item) => item.tag
                    ),
            })

            setLoading(false)
        }

        loadEvent()
    }, [eventId, reloadKey])

    const isDirty = useMemo(() => {
        if (!initialSnapshot) {
            return false
        }

        const currentSnapshot: EditSnapshot = {
            eventDate,
            title,
            mainVisualPositionX,
            mainVisualPositionY,
            seatBlockRow,
            seatNumber,
            venue,
            doorsTime,
            startTime,
            ticketPrice,
            memo,
            officialUrl,

            setlistItems:
                setlistItems.map((item) => ({
                    displayLabel: item.displayLabel,
                    title: item.title,
                    detail: item.detail,
                    note: item.note,
                })),

            artists,
            hashtags,
        }

        const textOrListChanged =
            JSON.stringify(currentSnapshot) !==
            JSON.stringify(initialSnapshot)

        const imageChanged =
            newMainVisual !== null ||
            removeMainVisual ||
            newOfficialPhotos.length > 0 ||
            newPersonalPhotos.length > 0 ||
            deletedPhotoIds.length > 0

        return textOrListChanged || imageChanged
    }, [
        initialSnapshot,
        eventDate,
        title,
        seatBlockRow,
        seatNumber,
        venue,
        doorsTime,
        startTime,
        ticketPrice,
        memo,
        officialUrl,
        setlistItems,
        artists,
        hashtags,
        newMainVisual,
        removeMainVisual,
        newOfficialPhotos,
        newPersonalPhotos,
        deletedPhotoIds,
    ])

    useEffect(() => {
        return () => {
            if (newMainVisualPreviewUrl) {
                URL.revokeObjectURL(
                    newMainVisualPreviewUrl
                )
            }
        }
    }, [newMainVisualPreviewUrl])

    useEffect(() => {
        if (isEditing) {
            setIsMultilineTitle(false)
            return
        }

        const element =
            titleDisplayRef.current

        if (!element) {
            return
        }

        function checkMultiline() {
            if (!element) {
                return
            }

            const style =
                window.getComputedStyle(element)

            const lineHeight =
                parseFloat(style.lineHeight)

            if (!Number.isFinite(lineHeight)) {
                return
            }

            setIsMultilineTitle(
                element.scrollHeight >
                lineHeight * 1.5
            )
        }

        checkMultiline()

        const observer =
            new ResizeObserver(checkMultiline)

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [isEditing, title])

    useEffect(() => {
        function handleBeforeUnload(
            event: BeforeUnloadEvent
        ) {
            if (!isDirty) {
                return
            }

            event.preventDefault()
            event.returnValue = ''
        }

        window.addEventListener(
            'beforeunload',
            handleBeforeUnload
        )

        return () => {
            window.removeEventListener(
                'beforeunload',
                handleBeforeUnload
            )
        }
    }, [isDirty])

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

    function addSetlistItem() {
        setSetlistItems((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                displayLabel: '',
                title: '',
                detail: '',
                note: '',
            },
        ])
    }

    function updateSetlistItem(
        id: string,
        field: 'displayLabel' | 'title' | 'detail' | 'note',
        value: string
    ) {
        setSetlistItems((current) =>
            current.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        [field]: value,
                    }
                    : item
            )
        )
    }

    function deleteSetlistItem(id: string) {
        setSetlistItems((current) =>
            current.filter((item) => item.id !== id)
        )
    }

    function moveSetlistItem(
        id: string,
        direction: 'up' | 'down'
    ) {
        setSetlistItems((current) => {
            const index = current.findIndex(
                (item) => item.id === id
            )

            if (index === -1) {
                return current
            }

            const targetIndex =
                direction === 'up'
                    ? index - 1
                    : index + 1

            if (
                targetIndex < 0 ||
                targetIndex >= current.length
            ) {
                return current
            }

            const updated = [...current]

                ;[updated[index], updated[targetIndex]] = [
                    updated[targetIndex],
                    updated[index],
                ]

            return updated
        })
    }

    function addArtist() {
        const value = artistInput.trim()

        if (!value) {
            return
        }

        const alreadyExists = artists.some(
            (artist) =>
                artist.toLowerCase() === value.toLowerCase()
        )

        if (alreadyExists) {
            setArtistInput('')
            return
        }

        setArtists((current) => [
            ...current,
            value,
        ])

        setArtistInput('')
    }

    function deleteArtist(index: number) {
        setArtists((current) =>
            current.filter(
                (_, currentIndex) =>
                    currentIndex !== index
            )
        )
    }

    function addHashtag() {
        const value = hashtagInput.trim()

        if (!value) {
            return
        }

        const alreadyExists = hashtags.some(
            (tag) =>
                tag.toLowerCase() === value.toLowerCase()
        )

        if (alreadyExists) {
            setHashtagInput('')
            return
        }

        setHashtags((current) => [
            ...current,
            value,
        ])

        setHashtagInput('')
    }

    function deleteHashtag(index: number) {
        setHashtags((current) =>
            current.filter(
                (_, currentIndex) =>
                    currentIndex !== index
            )
        )
    }

    function copyArtistsToHashtags() {
        setHashtags([...artists])
    }

    async function handleMainVisualChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        try {
            const compressedFile =
                await compressImage(file)

            const previewUrl =
                URL.createObjectURL(compressedFile)

            setNewMainVisual(compressedFile)
            setNewMainVisualPreviewUrl(previewUrl)

            setNewMainVisualPositionX(50)
            setNewMainVisualPositionY(50)

            setRemoveMainVisual(false)

            event.target.value = ''
        } catch {
            setErrorMessage(
                '画像の読み込みに失敗しました。'
            )
        }
    }

    function cancelNewMainVisual() {
        setNewMainVisual(null)
        setNewMainVisualPreviewUrl(null)
        setNewMainVisualPositionX(50)
        setNewMainVisualPositionY(50)
    }

    function deleteMainVisual() {
        setNewMainVisual(null)
        setNewMainVisualPreviewUrl(null)
        setRemoveMainVisual(true)
    }

    async function handlePhotoSelect(
        event: ChangeEvent<HTMLInputElement>,
        type: 'official' | 'personal'
    ) {
        const files = Array.from(
            event.target.files ?? []
        )

        if (files.length === 0) {
            return
        }

        const max =
            type === 'official' ? 20 : 5

        const existingPhotos =
            type === 'official'
                ? officialPhotos
                : personalPhotos

        const newPhotos =
            type === 'official'
                ? newOfficialPhotos
                : newPersonalPhotos

        const existingCount =
            existingPhotos.filter(
                (photo) =>
                    !deletedPhotoIds.includes(photo.id)
            ).length

        if (
            existingCount +
            newPhotos.length +
            files.length >
            max
        ) {
            setErrorMessage(
                type === 'official'
                    ? 'OFFICIAL PHOTOSは最大20枚です。'
                    : 'MY PHOTOSは最大5枚です。'
            )

            event.target.value = ''
            return
        }

        try {
            const addedPhotos: NewPhoto[] = []

            for (const file of files) {
                const compressedFile =
                    await compressImage(file)

                addedPhotos.push({
                    id: crypto.randomUUID(),
                    file: compressedFile,
                    previewUrl:
                        URL.createObjectURL(
                            compressedFile
                        ),
                })
            }

            if (type === 'official') {
                setNewOfficialPhotos(
                    (current) => [
                        ...current,
                        ...addedPhotos,
                    ]
                )
            } else {
                setNewPersonalPhotos(
                    (current) => [
                        ...current,
                        ...addedPhotos,
                    ]
                )
            }
        } catch {
            setErrorMessage(
                '画像の読み込みに失敗しました。'
            )
        }

        event.target.value = ''
    }

    function deleteExistingPhoto(id: string) {
        setDeletedPhotoIds(
            (current) => [
                ...current,
                id,
            ]
        )
    }

    function deleteNewPhoto(
        id: string,
        type: 'official' | 'personal'
    ) {
        if (type === 'official') {
            setNewOfficialPhotos(
                (current) => {
                    const target =
                        current.find(
                            (photo) => photo.id === id
                        )

                    if (target) {
                        URL.revokeObjectURL(
                            target.previewUrl
                        )
                    }

                    return current.filter(
                        (photo) =>
                            photo.id !== id
                    )
                }
            )
        } else {
            setNewPersonalPhotos(
                (current) => {
                    const target =
                        current.find(
                            (photo) => photo.id === id
                        )

                    if (target) {
                        URL.revokeObjectURL(
                            target.previewUrl
                        )
                    }

                    return current.filter(
                        (photo) =>
                            photo.id !== id
                    )
                }
            )
        }
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault()

        setSaving(true)
        setErrorMessage('')

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            setErrorMessage(
                'ログイン情報を確認できませんでした。'
            )
            setSaving(false)
            return
        }

        const { error: eventUpdateError } =
            await supabase
                .from('events')
                .update({
                    event_date: eventDate,
                    title: title.trim(),

                    main_visual_position_x:
                        newMainVisual
                            ? newMainVisualPositionX
                            : mainVisualPositionX,

                    main_visual_position_y:
                        newMainVisual
                            ? newMainVisualPositionY
                            : mainVisualPositionY,

                    seat_block_row:
                        seatBlockRow.trim() || null,

                    seat_number:
                        seatNumber.trim() || null,

                    venue:
                        venue.trim() || null,

                    doors_time:
                        doorsTime || null,

                    start_time:
                        startTime || null,

                    ticket_price:
                        ticketPrice.trim() || null,

                    memo:
                        memo.trim() || null,

                    official_url:
                        officialUrl.trim() || null,
                })
                .eq('id', eventId)

        if (eventUpdateError) {
            setErrorMessage(
                `イベント情報の保存に失敗しました：${eventUpdateError.message}`
            )
            setSaving(false)
            return
        }

        /*
 * MAIN VISUAL
 */

        if (newMainVisual) {
            const newMainVisualPath =
                `${user.id}/events/${eventId}/main/main-visual.webp`

            const { error: uploadError } =
                await supabase.storage
                    .from('event-images')
                    .upload(
                        newMainVisualPath,
                        newMainVisual,
                        {
                            upsert: true,
                            contentType: 'image/webp',
                        }
                    )

            if (uploadError) {
                setErrorMessage(
                    `MAIN VISUALの保存に失敗しました：${uploadError.message}`
                )
                setSaving(false)
                return
            }

            const { error: pathUpdateError } =
                await supabase
                    .from('events')
                    .update({
                        main_visual_path:
                            newMainVisualPath,
                    })
                    .eq('id', eventId)

            if (pathUpdateError) {
                setErrorMessage(
                    `MAIN VISUAL情報の保存に失敗しました：${pathUpdateError.message}`
                )
                setSaving(false)
                return
            }

            if (
                mainVisualPath &&
                mainVisualPath !==
                newMainVisualPath
            ) {
                await supabase.storage
                    .from('event-images')
                    .remove([mainVisualPath])
            }
        } else if (
            removeMainVisual &&
            mainVisualPath
        ) {
            const { error: pathUpdateError } =
                await supabase
                    .from('events')
                    .update({
                        main_visual_path: null,
                    })
                    .eq('id', eventId)

            if (pathUpdateError) {
                setErrorMessage(
                    `MAIN VISUAL情報の削除に失敗しました：${pathUpdateError.message}`
                )
                setSaving(false)
                return
            }

            await supabase.storage
                .from('event-images')
                .remove([mainVisualPath])
        }

        /*
 * PHOTO
 */

        const remainingOfficialPhotos =
            officialPhotos.filter(
                (photo) =>
                    !deletedPhotoIds.includes(
                        photo.id
                    )
            )

        const remainingPersonalPhotos =
            personalPhotos.filter(
                (photo) =>
                    !deletedPhotoIds.includes(
                        photo.id
                    )
            )

        /*
         * 残す既存画像の並び順を整理
         */

        for (
            let index = 0;
            index <
            remainingOfficialPhotos.length;
            index++
        ) {
            await supabase
                .from('event_photos')
                .update({
                    sort_order: index,
                })
                .eq(
                    'id',
                    remainingOfficialPhotos[
                        index
                    ].id
                )
        }

        for (
            let index = 0;
            index <
            remainingPersonalPhotos.length;
            index++
        ) {
            await supabase
                .from('event_photos')
                .update({
                    sort_order: index,
                })
                .eq(
                    'id',
                    remainingPersonalPhotos[
                        index
                    ].id
                )
        }

        /*
         * 新しい画像をアップロード
         */

        const uploadedPhotoPaths: string[] =
            []

        const newPhotoRows: {
            event_id: string
            photo_type: 'official' | 'personal'
            storage_path: string
            sort_order: number
        }[] = []

        for (
            let index = 0;
            index < newOfficialPhotos.length;
            index++
        ) {
            const photo =
                newOfficialPhotos[index]

            const storagePath =
                `${user.id}/events/${eventId}/official/` +
                `${crypto.randomUUID()}.webp`

            const { error: uploadError } =
                await supabase.storage
                    .from('event-images')
                    .upload(
                        storagePath,
                        photo.file,
                        {
                            contentType:
                                'image/webp',
                        }
                    )

            if (uploadError) {
                if (
                    uploadedPhotoPaths.length > 0
                ) {
                    await supabase.storage
                        .from('event-images')
                        .remove(
                            uploadedPhotoPaths
                        )
                }

                setErrorMessage(
                    `OFFICIAL PHOTOSの保存に失敗しました：${uploadError.message}`
                )
                setSaving(false)
                return
            }

            uploadedPhotoPaths.push(
                storagePath
            )

            newPhotoRows.push({
                event_id: eventId,
                photo_type: 'official',
                storage_path: storagePath,
                sort_order:
                    remainingOfficialPhotos.length +
                    index,
            })
        }

        for (
            let index = 0;
            index < newPersonalPhotos.length;
            index++
        ) {
            const photo =
                newPersonalPhotos[index]

            const storagePath =
                `${user.id}/events/${eventId}/personal/` +
                `${crypto.randomUUID()}.webp`

            const { error: uploadError } =
                await supabase.storage
                    .from('event-images')
                    .upload(
                        storagePath,
                        photo.file,
                        {
                            contentType:
                                'image/webp',
                        }
                    )

            if (uploadError) {
                if (
                    uploadedPhotoPaths.length > 0
                ) {
                    await supabase.storage
                        .from('event-images')
                        .remove(
                            uploadedPhotoPaths
                        )
                }

                setErrorMessage(
                    `MY PHOTOSの保存に失敗しました：${uploadError.message}`
                )
                setSaving(false)
                return
            }

            uploadedPhotoPaths.push(
                storagePath
            )

            newPhotoRows.push({
                event_id: eventId,
                photo_type: 'personal',
                storage_path: storagePath,
                sort_order:
                    remainingPersonalPhotos.length +
                    index,
            })
        }

        /*
         * 新しいPHOTO情報をDBへ追加
         */

        if (newPhotoRows.length > 0) {
            const { error: photoInsertError } =
                await supabase
                    .from('event_photos')
                    .insert(newPhotoRows)

            if (photoInsertError) {
                if (
                    uploadedPhotoPaths.length > 0
                ) {
                    await supabase.storage
                        .from('event-images')
                        .remove(
                            uploadedPhotoPaths
                        )
                }

                setErrorMessage(
                    `PHOTO情報の保存に失敗しました：${photoInsertError.message}`
                )
                setSaving(false)
                return
            }
        }

        /*
         * 削除予定の既存PHOTOを削除
         */

        const photosToDelete = [
            ...officialPhotos,
            ...personalPhotos,
        ].filter((photo) =>
            deletedPhotoIds.includes(photo.id)
        )

        if (photosToDelete.length > 0) {
            const { error: photoDeleteError } =
                await supabase
                    .from('event_photos')
                    .delete()
                    .in(
                        'id',
                        photosToDelete.map(
                            (photo) => photo.id
                        )
                    )

            if (photoDeleteError) {
                setErrorMessage(
                    `PHOTOの削除に失敗しました：${photoDeleteError.message}`
                )
                setSaving(false)
                return
            }

            const pathsToDelete =
                photosToDelete.map(
                    (photo) =>
                        photo.storage_path
                )

            await supabase.storage
                .from('event-images')
                .remove(pathsToDelete)
        }

        /*
         * SETLIST
         */

        const { error: setlistDeleteError } =
            await supabase
                .from('setlist_items')
                .delete()
                .eq('event_id', eventId)

        if (setlistDeleteError) {
            setErrorMessage(
                `SETLISTの更新に失敗しました：${setlistDeleteError.message}`
            )
            setSaving(false)
            return
        }

        const validSetlistItems =
            setlistItems.filter(
                (item) =>
                    item.title.trim() !== ''
            )

        if (validSetlistItems.length > 0) {
            const setlistRows =
                validSetlistItems.map(
                    (item, index) => ({
                        event_id: eventId,
                        position: index + 1,
                        display_label:
                            item.displayLabel.trim() || null,
                        title: item.title.trim(),
                        detail:
                            item.detail.trim() || null,
                        note:
                            item.note.trim() || null,
                    })
                )

            const { error: setlistInsertError } =
                await supabase
                    .from('setlist_items')
                    .insert(setlistRows)

            if (setlistInsertError) {
                setErrorMessage(
                    `SETLIST情報の保存に失敗しました：${setlistInsertError.message}`
                )
                setSaving(false)
                return
            }
        }

        /*
         * ARTIST
         */

        const { error: artistDeleteError } =
            await supabase
                .from('event_artists')
                .delete()
                .eq('event_id', eventId)

        if (artistDeleteError) {
            setErrorMessage(
                `ARTISTの更新に失敗しました：${artistDeleteError.message}`
            )
            setSaving(false)
            return
        }

        if (artists.length > 0) {
            const artistRows =
                artists.map(
                    (artist, index) => ({
                        event_id: eventId,
                        name: artist,
                        sort_order: index,
                    })
                )

            const { error: artistInsertError } =
                await supabase
                    .from('event_artists')
                    .insert(artistRows)

            if (artistInsertError) {
                setErrorMessage(
                    `ARTIST情報の保存に失敗しました：${artistInsertError.message}`
                )
                setSaving(false)
                return
            }
        }

        /*
         * HASHTAG
         */

        const { error: hashtagDeleteError } =
            await supabase
                .from('event_hashtags')
                .delete()
                .eq('event_id', eventId)

        if (hashtagDeleteError) {
            setErrorMessage(
                `HASHTAGの更新に失敗しました：${hashtagDeleteError.message}`
            )
            setSaving(false)
            return
        }

        if (hashtags.length > 0) {
            const hashtagRows =
                hashtags.map(
                    (tag, index) => ({
                        event_id: eventId,
                        tag,
                        sort_order: index,
                    })
                )

            const { error: hashtagInsertError } =
                await supabase
                    .from('event_hashtags')
                    .insert(hashtagRows)

            if (hashtagInsertError) {
                setErrorMessage(
                    `HASHTAG情報の保存に失敗しました：${hashtagInsertError.message}`
                )
                setSaving(false)
                return
            }
        }

        setNewMainVisual(null)
        setNewMainVisualPreviewUrl(null)
        setRemoveMainVisual(false)

        setNewOfficialPhotos([])
        setNewPersonalPhotos([])
        setDeletedPhotoIds([])

        setIsEditing(false)
        setSaving(false)

        setReloadKey((current) => current + 1)

    }

    function goBack() {
        requestListPositionRestore()
        router.push(returnTo)
    }

    function handleBack() {
        if (
            isEditing &&
            isDirty
        ) {
            setShowBackConfirmDialog(true)
            return
        }

        goBack()
    }

    if (loading) {
        return (
            <main className={styles.page}>
                <p>読み込み中...</p>
            </main>
        )
    }

    const hasPhotos =
        officialPhotos.length > 0 ||
        personalPhotos.length > 0

    const hasBothPhotoTypes =
        officialPhotos.length > 0 &&
        personalPhotos.length > 0

    const hasSetlist =
        setlistItems.some(
            (item) => item.title.trim() !== ''
        )

    const hasMemo =
        memo.trim() !== ''

    const hasOfficialUrl =
        officialUrl.trim() !== ''

    const hasArtists =
        artists.length > 0

    function getDisplayDomain(url: string) {
        try {
            return new URL(url).hostname.replace(/^www\./, '')
        } catch {
            return url
        }
    }

    return (
        <main
            className={`${styles.page} ${isEditing
                ? styles.pageEdit
                : styles.pageView
                }`}
        >
            <form
                onSubmit={handleSubmit}
                className={styles.eventForm}
            >
                <header className={styles.header}>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={handleBack}
                        aria-label="戻る"
                        title="戻る"
                    >
                        <ChevronLeft
                            size={28}
                            strokeWidth={2}
                        />
                    </button>

                    <h1 className={styles.headerTitle}>
                        {isEditing
                            ? '編集'
                            : '詳細'}
                    </h1>

                    {isEditing ? (
                        <button
                            type="submit"
                            aria-label="保存"
                            title="保存"
                            className={styles.saveButton}
                            disabled={saving}
                        >
                            <Save
                                size={27}
                                strokeWidth={2}
                            />
                        </button>
                    ) : (
                        <button
                            type="button"
                            aria-label="編集"
                            title="編集"
                            className={styles.saveButton}
                            onClick={(event) => {
                                event.preventDefault()
                                setIsEditing(true)
                            }}
                        >
                            <Pencil
                                size={24}
                                strokeWidth={2}
                            />
                        </button>
                    )}
                </header>

                <section
                    className={`${styles.topCard} ${!isEditing && isMultilineTitle
                        ? styles.topCardMultiline
                        : ''
                        }`}
                >
                    <div className={styles.dateTitleGrid}>
                        <div>
                            <div className={styles.fieldLabel}>
                                DATE
                            </div>

                            {isEditing ? (
                                <input
                                    id="event-date"
                                    type="date"
                                    value={eventDate}
                                    onChange={(event) =>
                                        setEventDate(
                                            event.target.value
                                        )
                                    }
                                    required
                                    className={`${styles.input} ${styles.dateInput}`}
                                />
                            ) : (
                                <div className={styles.dateDisplay}>
                                    <span>
                                        {eventDate.replaceAll('-', '.')}
                                    </span>

                                    <span className={styles.dateWeekday}>
                                        {eventDate
                                            ? ` (${[
                                                '日',
                                                '月',
                                                '火',
                                                '水',
                                                '木',
                                                '金',
                                                '土',
                                            ][
                                            new Date(
                                                `${eventDate}T00:00:00`
                                            ).getDay()
                                            ]})`
                                            : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className={styles.fieldLabel}>
                                TITLE
                            </div>

                            {isEditing ? (
                                <textarea
                                    id="title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(
                                            event.target.value
                                        )
                                    }
                                    required
                                    rows={1}
                                    className={`${styles.input} ${styles.titleInput}`}
                                />
                            ) : (
                                <div
                                    ref={titleDisplayRef}
                                    className={styles.titleDisplay}
                                >
                                    {title}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {(
                    isEditing ||
                    (!removeMainVisual && mainVisualUrl)
                ) && (
                        <section
                            className={`${styles.block} ${styles.mainVisualBlock}`}
                        >
                            {isEditing ? (
                                newMainVisualPreviewUrl ? (
                                    <MainVisualFrame
                                        src={newMainVisualPreviewUrl}
                                        alt="MAIN VISUAL"
                                        editable={true}
                                        positionX={
                                            newMainVisualPositionX
                                        }
                                        positionY={
                                            newMainVisualPositionY
                                        }
                                        onPositionChange={(x, y) => {
                                            setNewMainVisualPositionX(x)
                                            setNewMainVisualPositionY(y)
                                        }}
                                        onDelete={
                                            cancelNewMainVisual
                                        }
                                    />
                                ) : !removeMainVisual &&
                                    mainVisualUrl ? (
                                    <MainVisualFrame
                                        src={mainVisualUrl}
                                        alt="MAIN VISUAL"
                                        editable={true}
                                        positionX={
                                            mainVisualPositionX
                                        }
                                        positionY={
                                            mainVisualPositionY
                                        }
                                        onPositionChange={(x, y) => {
                                            setMainVisualPositionX(x)
                                            setMainVisualPositionY(y)
                                        }}
                                        onDelete={
                                            deleteMainVisual
                                        }
                                    />
                                ) : (
                                    <label
                                        className={
                                            styles.addVisualButton
                                        }
                                    >
                                        メインビジュアルを追加

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={
                                                handleMainVisualChange
                                            }
                                            hidden
                                        />
                                    </label>
                                )
                            ) : (
                                <MainVisualFrame
                                    src={mainVisualUrl!}
                                    alt="MAIN VISUAL"
                                    editable={false}
                                    positionX={
                                        mainVisualPositionX
                                    }
                                    positionY={
                                        mainVisualPositionY
                                    }
                                />
                            )}
                        </section>
                    )}

                <section
                    className={`${styles.block} ${!isEditing ? styles.ticketBlockView : ''
                        }`}
                >
                    {isEditing ? (
                        <>
                            <div className={styles.blockHeader}>
                                <h2 className={styles.blockTitle}>
                                    TICKET
                                </h2>
                            </div>

                            <div className={styles.ticketGrid}>
                                <div
                                    className={
                                        styles.ticketVenue
                                    }
                                >
                                    <label
                                        htmlFor="venue"
                                        className={
                                            styles.fieldLabel
                                        }
                                    >
                                        会場
                                    </label>

                                    <input
                                        id="venue"
                                        type="text"
                                        placeholder="例：横浜アリーナ"
                                        value={venue}
                                        onChange={(event) =>
                                            setVenue(
                                                event.target.value
                                            )
                                        }
                                        className={styles.input}
                                    />
                                </div>

                                <div
                                    className={
                                        styles.ticketWide
                                    }
                                >
                                    <label
                                        htmlFor="seat-block-row"
                                        className={
                                            styles.fieldLabel
                                        }
                                    >
                                        座席ブロック・列
                                    </label>

                                    <input
                                        id="seat-block-row"
                                        type="text"
                                        placeholder="例：アリーナ A 12列"
                                        value={seatBlockRow}
                                        onChange={(event) =>
                                            setSeatBlockRow(
                                                event.target.value
                                            )
                                        }
                                        className={styles.input}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="seat-number"
                                        className={
                                            styles.fieldLabel
                                        }
                                    >
                                        番号
                                    </label>

                                    <input
                                        id="seat-number"
                                        type="text"
                                        placeholder="例：24番"
                                        value={seatNumber}
                                        onChange={(event) =>
                                            setSeatNumber(
                                                event.target.value
                                            )
                                        }
                                        className={styles.input}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="doors-time"
                                        className={
                                            styles.fieldLabel
                                        }
                                    >
                                        開場時間
                                    </label>

                                    <input
                                        id="doors-time"
                                        type="time"
                                        value={doorsTime}
                                        onChange={(event) =>
                                            setDoorsTime(
                                                event.target.value
                                            )
                                        }
                                        className={styles.input}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="start-time"
                                        className={
                                            styles.fieldLabel
                                        }
                                    >
                                        開演時間
                                    </label>

                                    <input
                                        id="start-time"
                                        type="time"
                                        value={startTime}
                                        onChange={(event) =>
                                            setStartTime(
                                                event.target.value
                                            )
                                        }
                                        className={styles.input}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="ticket-price"
                                        className={
                                            styles.fieldLabel
                                        }
                                    >
                                        チケット料金
                                    </label>

                                    <input
                                        id="ticket-price"
                                        type="text"
                                        placeholder="例：7,000円"
                                        value={ticketPrice}
                                        onChange={(event) =>
                                            setTicketPrice(
                                                event.target.value
                                            )
                                        }
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.ticketDisplay}>
                            <div
                                className={
                                    styles.ticketDisplayHeader
                                }
                            >
                                TICKET
                            </div>

                            <div
                                className={
                                    styles.ticketDisplayTitle
                                }
                            >
                                {title}
                            </div>

                            {(seatBlockRow || seatNumber) && (
                                <div
                                    className={
                                        seatBlockRow
                                            ? styles.ticketDisplaySeats
                                            : styles.ticketDisplaySeatsSingle
                                    }
                                >
                                    {seatBlockRow && (
                                        <div
                                            className={
                                                styles.ticketDisplaySeatBlock
                                            }
                                        >
                                            <span
                                                className={
                                                    styles.ticketDisplayLabel
                                                }
                                            >
                                                BLOCK / ROW
                                            </span>

                                            <div
                                                className={
                                                    styles.ticketDisplaySeatValue
                                                }
                                            >
                                                {seatBlockRow}
                                            </div>
                                        </div>
                                    )}

                                    {seatNumber && (
                                        <div
                                            className={
                                                styles.ticketDisplaySeatNumber
                                            }
                                        >
                                            <span
                                                className={
                                                    styles.ticketDisplayLabel
                                                }
                                            >
                                                NUMBER
                                            </span>

                                            <div
                                                className={
                                                    styles.ticketDisplaySeatValue
                                                }
                                            >
                                                {seatNumber}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                className={
                                    styles.ticketDivider
                                }
                            />

                            <div
                                className={
                                    styles.ticketDisplayFooter
                                }
                            >
                                <div
                                    className={
                                        styles.ticketDisplayLeft
                                    }
                                >
                                    <div
                                        className={
                                            styles.ticketDisplayVenue
                                        }
                                    >
                                        {venue}
                                    </div>

                                    <div
                                        className={
                                            styles.ticketDisplayDate
                                        }
                                    >
                                        {eventDate && (
                                            <>
                                                {eventDate.replaceAll(
                                                    '-',
                                                    '.'
                                                )}

                                                <span
                                                    className={
                                                        styles.dateWeekday
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
                                                            `${eventDate}T00:00:00`
                                                        ).getDay()
                                                        ]
                                                    }
                                                    )
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className={
                                        styles.ticketDisplayRight
                                    }
                                >
                                    <div
                                        className={
                                            styles.ticketDisplayPrice
                                        }
                                    >
                                        {ticketPrice}
                                    </div>

                                    {(doorsTime ||
                                        startTime) && (
                                            <div
                                                className={
                                                    styles.ticketDisplayTime
                                                }
                                            >
                                                {doorsTime && (
                                                    <>
                                                        開場 {doorsTime}
                                                    </>
                                                )}

                                                {doorsTime &&
                                                    startTime &&
                                                    ' / '}

                                                {startTime && (
                                                    <>
                                                        開演 {startTime}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {(isEditing || hasPhotos) && (
                    <section className={styles.block}>
                        <div className={styles.blockHeader}>
                            <h2 className={styles.blockTitle}>
                                PHOTO
                            </h2>
                        </div>

                        {isEditing ? (
                            <>
                                <div className={styles.photoSection}>
                                    <h3 className={styles.photoLabel}>
                                        OFFICIAL PHOTOS (
                                        {officialPhotos.filter(
                                            (photo) =>
                                                !deletedPhotoIds.includes(
                                                    photo.id
                                                )
                                        ).length +
                                            newOfficialPhotos.length}
                                        /20)
                                    </h3>

                                    <div className={styles.photoTrack}>
                                        {officialPhotos
                                            .filter(
                                                (photo) =>
                                                    !deletedPhotoIds.includes(
                                                        photo.id
                                                    )
                                            )
                                            .map((photo) => (
                                                <div
                                                    key={photo.id}
                                                    className={
                                                        styles.photoItem
                                                    }
                                                >
                                                    <img
                                                        src={photo.previewUrl}
                                                        alt="OFFICIAL PHOTO"
                                                        className={
                                                            styles.photoThumb
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.photoDelete
                                                        }
                                                        onClick={() =>
                                                            deleteExistingPhoto(
                                                                photo.id
                                                            )
                                                        }
                                                        aria-label="画像を削除"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}

                                        {newOfficialPhotos.map(
                                            (photo) => (
                                                <div
                                                    key={photo.id}
                                                    className={
                                                        styles.photoItem
                                                    }
                                                >
                                                    <img
                                                        src={photo.previewUrl}
                                                        alt="NEW OFFICIAL PHOTO"
                                                        className={
                                                            styles.photoThumb
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.photoDelete
                                                        }
                                                        onClick={() =>
                                                            deleteNewPhoto(
                                                                photo.id,
                                                                'official'
                                                            )
                                                        }
                                                        aria-label="画像を削除"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        )}

                                        {officialPhotos.filter(
                                            (photo) =>
                                                !deletedPhotoIds.includes(
                                                    photo.id
                                                )
                                        ).length +
                                            newOfficialPhotos.length <
                                            20 && (
                                                <label
                                                    className={
                                                        styles.photoAdd
                                                    }
                                                >
                                                    ＋

                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(event) =>
                                                            handlePhotoSelect(
                                                                event,
                                                                'official'
                                                            )
                                                        }
                                                        hidden
                                                    />
                                                </label>
                                            )}
                                    </div>
                                </div>

                                <div className={styles.photoSection}>
                                    <h3 className={styles.photoLabel}>
                                        MY PHOTOS (
                                        {personalPhotos.filter(
                                            (photo) =>
                                                !deletedPhotoIds.includes(
                                                    photo.id
                                                )
                                        ).length +
                                            newPersonalPhotos.length}
                                        /5)
                                    </h3>

                                    <div className={styles.photoTrack}>
                                        {personalPhotos
                                            .filter(
                                                (photo) =>
                                                    !deletedPhotoIds.includes(
                                                        photo.id
                                                    )
                                            )
                                            .map((photo) => (
                                                <div
                                                    key={photo.id}
                                                    className={
                                                        styles.photoItem
                                                    }
                                                >
                                                    <img
                                                        src={photo.previewUrl}
                                                        alt="MY PHOTO"
                                                        className={
                                                            styles.photoThumb
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.photoDelete
                                                        }
                                                        onClick={() =>
                                                            deleteExistingPhoto(
                                                                photo.id
                                                            )
                                                        }
                                                        aria-label="画像を削除"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}

                                        {newPersonalPhotos.map(
                                            (photo) => (
                                                <div
                                                    key={photo.id}
                                                    className={
                                                        styles.photoItem
                                                    }
                                                >
                                                    <img
                                                        src={photo.previewUrl}
                                                        alt="NEW MY PHOTO"
                                                        className={
                                                            styles.photoThumb
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.photoDelete
                                                        }
                                                        onClick={() =>
                                                            deleteNewPhoto(
                                                                photo.id,
                                                                'personal'
                                                            )
                                                        }
                                                        aria-label="画像を削除"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        )}

                                        {personalPhotos.filter(
                                            (photo) =>
                                                !deletedPhotoIds.includes(
                                                    photo.id
                                                )
                                        ).length +
                                            newPersonalPhotos.length <
                                            5 && (
                                                <label
                                                    className={
                                                        styles.photoAdd
                                                    }
                                                >
                                                    ＋

                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={(event) =>
                                                            handlePhotoSelect(
                                                                event,
                                                                'personal'
                                                            )
                                                        }
                                                        hidden
                                                    />
                                                </label>
                                            )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {officialPhotos.length > 0 && (
                                    <div
                                        className={
                                            styles.photoSection
                                        }
                                    >
                                        {hasBothPhotoTypes && (
                                            <h3
                                                className={
                                                    styles.photoLabel
                                                }
                                            >
                                                OFFICIAL PHOTOS
                                            </h3>
                                        )}

                                        <div
                                            className={
                                                styles.photoTrack
                                            }
                                        >
                                            {officialPhotos.map(
                                                (photo) => (
                                                    <div
                                                        key={photo.id}
                                                        className={
                                                            styles.photoItem
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.photoViewerButton
                                                            }
                                                            onClick={() =>
                                                                setViewerPhoto({
                                                                    src: photo.previewUrl,
                                                                    alt: 'OFFICIAL PHOTO',
                                                                })
                                                            }
                                                            aria-label="OFFICIAL PHOTOを拡大表示"
                                                        >
                                                            <img
                                                                src={
                                                                    photo.previewUrl
                                                                }
                                                                alt="OFFICIAL PHOTO"
                                                                className={
                                                                    styles.photoThumb
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {personalPhotos.length > 0 && (
                                    <div
                                        className={
                                            styles.photoSection
                                        }
                                    >
                                        {hasBothPhotoTypes && (
                                            <h3
                                                className={
                                                    styles.photoLabel
                                                }
                                            >
                                                MY PHOTOS
                                            </h3>
                                        )}

                                        <div
                                            className={
                                                styles.photoTrack
                                            }
                                        >
                                            {personalPhotos.map(
                                                (photo) => (
                                                    <div
                                                        key={photo.id}
                                                        className={
                                                            styles.photoItem
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.photoViewerButton
                                                            }
                                                            onClick={() =>
                                                                setViewerPhoto({
                                                                    src: photo.previewUrl,
                                                                    alt: 'MY PHOTO',
                                                                })
                                                            }
                                                            aria-label="MY PHOTOを拡大表示"
                                                        >
                                                            <img
                                                                src={
                                                                    photo.previewUrl
                                                                }
                                                                alt="MY PHOTO"
                                                                className={
                                                                    styles.photoThumb
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}

                {(isEditing || hasSetlist) && (
                    <section className={styles.block}>
                        <div className={styles.blockHeader}>
                            <h2 className={styles.blockTitle}>
                                SETLIST
                            </h2>
                        </div>

                        {isEditing ? (
                            <>
                                <div className={styles.setlistEditor}>
                                    {setlistItems.map(
                                        (item, index) => (
                                            <div
                                                key={item.id}
                                                className={styles.setlistEditItem}
                                            >
                                                <div
                                                    className={styles.setlistEditTop}
                                                >
                                                    <div
                                                        className={styles.setlistNumberArea}
                                                    >
                                                        <span
                                                            className={styles.setlistNumber}
                                                        >
                                                            {String(
                                                                index + 1
                                                            ).padStart(2, '0')}
                                                        </span>

                                                        <input
                                                            type="text"
                                                            value={item.displayLabel}
                                                            onChange={(event) =>
                                                                updateSetlistItem(
                                                                    item.id,
                                                                    'displayLabel',
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="番号"
                                                            aria-label="表示番号"
                                                            className={styles.setlistLabelInput}
                                                        />
                                                    </div>

                                                    <div
                                                        className={styles.setlistFields}
                                                    >
                                                        <input
                                                            type="text"
                                                            placeholder="曲名"
                                                            value={item.title}
                                                            onChange={(event) =>
                                                                updateSetlistItem(
                                                                    item.id,
                                                                    'title',
                                                                    event.target.value
                                                                )
                                                            }
                                                            className={styles.setlistTitleInput}
                                                        />

                                                        <textarea
                                                            placeholder="詳細（例：歌手名）"
                                                            value={item.detail}
                                                            onChange={(event) =>
                                                                updateSetlistItem(
                                                                    item.id,
                                                                    'detail',
                                                                    event.target.value
                                                                )
                                                            }
                                                            rows={1}
                                                            className={styles.setlistDetailInput}
                                                        />

                                                        <input
                                                            type="text"
                                                            placeholder="備考"
                                                            value={item.note}
                                                            onChange={(event) =>
                                                                updateSetlistItem(
                                                                    item.id,
                                                                    'note',
                                                                    event.target.value
                                                                )
                                                            }
                                                            className={styles.setlistNoteInput}
                                                        />
                                                    </div>
                                                </div>

                                                <div
                                                    className={styles.setlistControls}
                                                >
                                                    <button
                                                        type="button"
                                                        className={styles.setlistControlButton}
                                                        onClick={() =>
                                                            moveSetlistItem(
                                                                item.id,
                                                                'up'
                                                            )
                                                        }
                                                        disabled={index === 0}
                                                        aria-label="上へ移動"
                                                    >
                                                        ↑
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={styles.setlistControlButton}
                                                        onClick={() =>
                                                            moveSetlistItem(
                                                                item.id,
                                                                'down'
                                                            )
                                                        }
                                                        disabled={
                                                            index ===
                                                            setlistItems.length - 1
                                                        }
                                                        aria-label="下へ移動"
                                                    >
                                                        ↓
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={styles.setlistDeleteButton}
                                                        onClick={() =>
                                                            deleteSetlistItem(
                                                                item.id
                                                            )
                                                        }
                                                    >
                                                        削除
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className={styles.setlistAddButton}
                                    onClick={addSetlistItem}
                                >
                                    項目を追加
                                </button>
                            </>
                        ) : (
                            <div className={styles.setlistDisplay}>
                                {(() => {
                                    let autoNumber = 0

                                    const visibleItems =
                                        setlistItems.filter(
                                            (item) =>
                                                item.title.trim() !== ''
                                        )

                                    return visibleItems.map((item) => {
                                        const customLabel =
                                            item.displayLabel.trim()

                                        if (!customLabel) {
                                            autoNumber += 1
                                        }

                                        const displayNumber =
                                            customLabel ||
                                            String(autoNumber).padStart(
                                                2,
                                                '0'
                                            )

                                        return (
                                            <div
                                                key={item.id}
                                                className={styles.setlistDisplayItem}
                                            >
                                                <span
                                                    className={styles.setlistNumber}
                                                >
                                                    {displayNumber}
                                                </span>

                                                <div
                                                    className={styles.setlistDisplayContent}
                                                >
                                                    <div
                                                        className={styles.setlistDisplayTitle}
                                                    >
                                                        {item.title}
                                                    </div>

                                                    {item.detail && (
                                                        <div
                                                            className={styles.setlistDisplayDetail}
                                                        >
                                                            {item.detail}
                                                        </div>
                                                    )}
                                                </div>

                                                {item.note && (
                                                    <span
                                                        className={styles.setlistNote}
                                                    >
                                                        {item.note}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })
                                })()}
                            </div>
                        )}
                    </section>
                )}

                {(isEditing || hasMemo) && (
                    <section className={styles.block}>
                        <div className={styles.blockHeader}>
                            <h2 className={styles.blockTitle}>
                                MEMO
                            </h2>
                        </div>

                        {isEditing ? (
                            <textarea
                                placeholder="メモを入力"
                                value={memo}
                                onChange={(event) =>
                                    setMemo(event.target.value)
                                }
                                rows={3}
                                className={styles.memoInput}
                            />
                        ) : (
                            <div className={styles.memoText}>
                                {memo}
                            </div>
                        )}
                    </section>
                )}

                {(isEditing || hasOfficialUrl) && (
                    <section className={styles.block}>
                        <div className={styles.blockHeader}>
                            <h2 className={styles.blockTitle}>
                                OFFICIAL WEBSITE
                            </h2>
                        </div>

                        {isEditing ? (
                            <input
                                type="url"
                                placeholder="URL"
                                value={officialUrl}
                                onChange={(event) =>
                                    setOfficialUrl(
                                        event.target.value
                                    )
                                }
                                className={styles.officialUrlInput}
                            />
                        ) : (
                            <a
                                href={officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.officialUrlLink}
                            >
                                {getDisplayDomain(officialUrl)}
                            </a>
                        )}
                    </section>
                )}

                {(isEditing || hasArtists) && (
                    <section className={styles.block}>
                        <div className={styles.blockHeader}>
                            <h2 className={styles.blockTitle}>
                                ARTIST
                            </h2>
                        </div>

                        {isEditing ? (
                            <>
                                <div className={styles.artistList}>
                                    {artists.map((artist, index) => (
                                        <span
                                            key={`${artist}-${index}`}
                                            className={`${styles.artistChip} ${styles.artistChipEdit}`}
                                        >
                                            {artist}

                                            <button
                                                type="button"
                                                className={styles.artistDelete}
                                                onClick={() =>
                                                    deleteArtist(index)
                                                }
                                                aria-label={`${artist}を削除`}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className={styles.artistEditor}>
                                    <input
                                        type="text"
                                        placeholder="出演者"
                                        value={artistInput}
                                        onChange={(event) =>
                                            setArtistInput(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault()
                                                addArtist()
                                            }
                                        }}
                                        className={styles.artistInput}
                                    />

                                    <button
                                        type="button"
                                        onClick={addArtist}
                                        className={styles.artistAddButton}
                                    >
                                        追加
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.artistList}>
                                {artists.map((artist, index) => (
                                    <span
                                        key={`${artist}-${index}`}
                                        className={styles.artistChip}
                                    >
                                        {artist}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {isEditing && (
                    <section className={styles.block}>
                        <div className={styles.blockHeader}>
                            <h2 className={styles.blockTitle}>
                                HASHTAG
                            </h2>
                        </div>

                        {isEditing ? (
                            <>
                                <div className={styles.hashtagList}>
                                    {hashtags.map((tag, index) => (
                                        <span
                                            key={`${tag}-${index}`}
                                            className={`${styles.hashtagChip} ${styles.hashtagChipEdit}`}
                                        >
                                            {tag}

                                            <button
                                                type="button"
                                                className={styles.hashtagDelete}
                                                onClick={() =>
                                                    deleteHashtag(index)
                                                }
                                                aria-label={`${tag}を削除`}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className={styles.hashtagEditor}>
                                    <input
                                        type="text"
                                        placeholder="タグ"
                                        value={hashtagInput}
                                        onChange={(event) =>
                                            setHashtagInput(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault()
                                                addHashtag()
                                            }
                                        }}
                                        className={styles.hashtagInput}
                                    />

                                    <button
                                        type="button"
                                        onClick={addHashtag}
                                        className={styles.hashtagAddButton}
                                    >
                                        追加
                                    </button>
                                </div>

                                {artists.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={copyArtistsToHashtags}
                                        className={styles.hashtagCopyButton}
                                    >
                                        ARTISTからコピー
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className={styles.hashtagList}>
                                {hashtags.map((tag, index) => (
                                    <span
                                        key={`${tag}-${index}`}
                                        className={styles.hashtagChip}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {errorMessage && (
                    <p>{errorMessage}</p>
                )}

                <div className={styles.deleteEventArea}>
                    <DeleteEventButton
                        eventId={eventId}
                        returnTo={returnTo}
                        className={styles.deleteEventButton}
                    />
                </div>

            </form>

            {viewerPhoto && (
                <ImageViewer
                    src={viewerPhoto.src}
                    alt={viewerPhoto.alt}
                    onClose={() =>
                        setViewerPhoto(null)
                    }
                />
            )}

            <ConfirmDialog
                open={showBackConfirmDialog}
                message="未保存の変更を破棄しますか？"
                onCancel={() =>
                    setShowBackConfirmDialog(false)
                }
                onConfirm={() => {
                    setShowBackConfirmDialog(false)
                    goBack()
                }}
            />

            <FooterNav
                isDirty={isDirty}
            />

        </main>
    )
}