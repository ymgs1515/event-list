'use client'

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useParams, useRouter, useSearchParams, } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image/compress'
import FooterNav from '@/components/FooterNav'

const supabase = createClient()

type SetlistItem = {
    id: string
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
    seatBlockRow: string
    seatNumber: string
    venue: string
    doorsTime: string
    startTime: string
    ticketPrice: string
    memo: string
    officialUrl: string
    setlistItems: {
        title: string
        detail: string
        note: string
    }[]
    artists: string[]
    hashtags: string[]
}

export default function EditEventPage() {
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

    const [officialPhotos, setOfficialPhotos] = useState<ExistingPhoto[]>([])
    const [personalPhotos, setPersonalPhotos] = useState<ExistingPhoto[]>([])

    const [newOfficialPhotos, setNewOfficialPhotos] =
        useState<NewPhoto[]>([])

    const [newPersonalPhotos, setNewPersonalPhotos] =
        useState<NewPhoto[]>([])

    const [deletedPhotoIds, setDeletedPhotoIds] =
        useState<string[]>([])

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

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

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
            main_visual_path
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
            }

            const { data: setlistData, error: setlistError } =
                await supabase
                    .from('setlist_items')
                    .select('id, position, title, detail, note')
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
    }, [eventId])

    const isDirty = useMemo(() => {
        if (!initialSnapshot) {
            return false
        }

        const currentSnapshot: EditSnapshot = {
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

            setlistItems:
                setlistItems.map((item) => ({
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

    function addSetlistItem() {
        setSetlistItems((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                title: '',
                detail: '',
                note: '',
            },
        ])
    }

    function updateSetlistItem(
        id: string,
        field: 'title' | 'detail' | 'note',
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

        router.push(returnTo)

    }

    if (loading) {
        return (
            <main>
                <p>読み込み中...</p>
            </main>
        )
    }

    if (errorMessage && !eventDate) {
        return (
            <main>
                <h1>
                    EVENT LIST - EDIT EVENT
                </h1>

                <p>{errorMessage}</p>
            </main>
        )
    }

    return (
        <main>
            <h1>
                EVENT LIST - EDIT EVENT
            </h1>

            <form onSubmit={handleSubmit}>

                <section>
                    <div>
                        <label htmlFor="event-date">
                            公演日
                        </label>

                        <br />

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
                        />
                    </div>

                    <div>
                        <label htmlFor="title">
                            公演名
                        </label>

                        <br />

                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>
                </section>

                <section>
                    <h2>MAIN VISUAL</h2>

                    {newMainVisualPreviewUrl ? (
                        <>
                            <img
                                src={newMainVisualPreviewUrl}
                                alt="MAIN VISUAL"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    maxWidth: '300px',
                                    height: 'auto',
                                }}
                            />

                            <button
                                type="button"
                                onClick={cancelNewMainVisual}
                            >
                                変更を取り消す
                            </button>
                        </>
                    ) : !removeMainVisual && mainVisualUrl ? (
                        <>
                            <img
                                src={mainVisualUrl}
                                alt="MAIN VISUAL"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    maxWidth: '300px',
                                    height: 'auto',
                                }}
                            />

                            <button
                                type="button"
                                onClick={deleteMainVisual}
                            >
                                削除
                            </button>
                        </>
                    ) : (
                        <p>画像未設定</p>
                    )}

                    <div>
                        <label>
                            {mainVisualUrl &&
                                !removeMainVisual
                                ? '画像を変更'
                                : '画像を追加'}

                            <br />

                            <input
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleMainVisualChange
                                }
                            />
                        </label>
                    </div>
                </section>

                <section>
                    <h2>TICKET</h2>

                    <div>
                        <label htmlFor="seat-block-row">
                            座席ブロック・列
                        </label>

                        <br />

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
                        />
                    </div>

                    <div>
                        <label htmlFor="seat-number">
                            座席番号
                        </label>

                        <br />

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
                        />
                    </div>

                    <div>
                        <label htmlFor="venue">
                            会場
                        </label>

                        <br />

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
                        />
                    </div>

                    <div>
                        <label htmlFor="doors-time">
                            開場時間
                        </label>

                        <br />

                        <input
                            id="doors-time"
                            type="time"
                            value={doorsTime}
                            onChange={(event) =>
                                setDoorsTime(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label htmlFor="start-time">
                            開演時間
                        </label>

                        <br />

                        <input
                            id="start-time"
                            type="time"
                            value={startTime}
                            onChange={(event) =>
                                setStartTime(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label htmlFor="ticket-price">
                            チケット料金
                        </label>

                        <br />

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
                        />
                    </div>
                </section>

                <section>
                    <h2>PHOTO</h2>

                    <div>
                        <h3>
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

                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                overflowX: 'auto',
                            }}
                        >
                            {officialPhotos
                                .filter(
                                    (photo) =>
                                        !deletedPhotoIds.includes(
                                            photo.id
                                        )
                                )
                                .map((photo) => (
                                    <div key={photo.id}>
                                        <img
                                            src={photo.previewUrl}
                                            alt="OFFICIAL PHOTO"
                                            style={{
                                                display: 'block',
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteExistingPhoto(
                                                    photo.id
                                                )
                                            }
                                        >
                                            削除
                                        </button>
                                    </div>
                                ))}

                            {newOfficialPhotos.map(
                                (photo) => (
                                    <div key={photo.id}>
                                        <img
                                            src={photo.previewUrl}
                                            alt="NEW OFFICIAL PHOTO"
                                            style={{
                                                display: 'block',
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteNewPhoto(
                                                    photo.id,
                                                    'official'
                                                )
                                            }
                                        >
                                            削除
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

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
                        />
                    </div>

                    <div>
                        <h3>
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

                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                overflowX: 'auto',
                            }}
                        >
                            {personalPhotos
                                .filter(
                                    (photo) =>
                                        !deletedPhotoIds.includes(
                                            photo.id
                                        )
                                )
                                .map((photo) => (
                                    <div key={photo.id}>
                                        <img
                                            src={photo.previewUrl}
                                            alt="MY PHOTO"
                                            style={{
                                                display: 'block',
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteExistingPhoto(
                                                    photo.id
                                                )
                                            }
                                        >
                                            削除
                                        </button>
                                    </div>
                                ))}

                            {newPersonalPhotos.map(
                                (photo) => (
                                    <div key={photo.id}>
                                        <img
                                            src={photo.previewUrl}
                                            alt="NEW MY PHOTO"
                                            style={{
                                                display: 'block',
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                deleteNewPhoto(
                                                    photo.id,
                                                    'personal'
                                                )
                                            }
                                        >
                                            削除
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

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
                        />
                    </div>
                </section>

                <section>
                    <h2>SETLIST</h2>

                    {setlistItems.map(
                        (item, index) => (
                            <div
                                key={item.id}
                                style={{
                                    marginBottom: '24px',
                                    paddingBottom: '16px',
                                    borderBottom:
                                        '1px solid #ccc',
                                }}
                            >
                                <strong>
                                    {String(
                                        index + 1
                                    ).padStart(2, '0')}
                                </strong>

                                <div>
                                    <label>
                                        曲名
                                        <br />

                                        <input
                                            type="text"
                                            placeholder="曲名を入力"
                                            value={item.title}
                                            onChange={(event) =>
                                                updateSetlistItem(
                                                    item.id,
                                                    'title',
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label>
                                        詳細
                                        <br />

                                        <input
                                            type="text"
                                            placeholder="詳細を入力（例：歌手名）"
                                            value={item.detail}
                                            onChange={(event) =>
                                                updateSetlistItem(
                                                    item.id,
                                                    'detail',
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label>
                                        備考
                                        <br />

                                        <input
                                            type="text"
                                            placeholder="備考を入力"
                                            value={item.note}
                                            onChange={(event) =>
                                                updateSetlistItem(
                                                    item.id,
                                                    'note',
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        moveSetlistItem(
                                            item.id,
                                            'up'
                                        )
                                    }
                                    disabled={
                                        index === 0
                                    }
                                >
                                    ↑
                                </button>

                                <button
                                    type="button"
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
                                >
                                    ↓
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        deleteSetlistItem(
                                            item.id
                                        )
                                    }
                                >
                                    削除
                                </button>
                            </div>
                        )
                    )}

                    <button
                        type="button"
                        onClick={addSetlistItem}
                    >
                        ＋ 項目を追加
                    </button>
                </section>

                <section>
                    <h2>MEMO</h2>

                    <textarea
                        placeholder="メモを入力"
                        value={memo}
                        onChange={(event) =>
                            setMemo(
                                event.target.value
                            )
                        }
                        rows={6}
                    />
                </section>

                <section>
                    <h2>OFFICIAL WEBSITE</h2>

                    <input
                        type="url"
                        placeholder="https://example.com"
                        value={officialUrl}
                        onChange={(event) =>
                            setOfficialUrl(
                                event.target.value
                            )
                        }
                    />
                </section>

                <section>
                    <h2>ARTIST</h2>

                    <div>
                        {artists.map(
                            (artist, index) => (
                                <span
                                    key={`${artist}-${index}`}
                                >
                                    {artist}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteArtist(index)
                                        }
                                    >
                                        ✕
                                    </button>
                                </span>
                            )
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="人物名を入力"
                        value={artistInput}
                        onChange={(event) =>
                            setArtistInput(
                                event.target.value
                            )
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key === 'Enter'
                            ) {
                                event.preventDefault()
                                addArtist()
                            }
                        }}
                    />

                    <button
                        type="button"
                        onClick={addArtist}
                    >
                        ＋ 人物を追加
                    </button>
                </section>

                <section>
                    <h2>HASHTAG</h2>

                    <div>
                        {hashtags.map(
                            (tag, index) => (
                                <span
                                    key={`${tag}-${index}`}
                                >
                                    {tag}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteHashtag(index)
                                        }
                                    >
                                        ✕
                                    </button>
                                </span>
                            )
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="タグを入力"
                        value={hashtagInput}
                        onChange={(event) =>
                            setHashtagInput(
                                event.target.value
                            )
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key === 'Enter'
                            ) {
                                event.preventDefault()
                                addHashtag()
                            }
                        }}
                    />

                    <button
                        type="button"
                        onClick={addHashtag}
                    >
                        ＋ タグを追加
                    </button>

                    {artists.length > 0 && (
                        <button
                            type="button"
                            onClick={
                                copyArtistsToHashtags
                            }
                        >
                            ARTISTからコピー
                        </button>
                    )}
                </section>

                {errorMessage && (
                    <p>{errorMessage}</p>
                )}

                <button
                    type="submit"
                    disabled={
                        saving ||
                        !eventDate ||
                        !title.trim()
                    }
                >
                    {saving
                        ? '保存中...'
                        : '保存'}
                </button>
            </form>

            <FooterNav
                isDirty={isDirty}
            />

        </main>
    )
}

