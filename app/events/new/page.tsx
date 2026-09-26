'use client'

import {
    ChangeEvent,
    FormEvent,
    Suspense,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useRouter,
    useSearchParams,
} from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image/compress'
import FooterNav from '@/components/FooterNav'
import { ChevronLeft, Save } from 'lucide-react'
import styles from '../EventForm.module.css'
import MainVisualFrame from '@/components/MainVisualFrame'
import ConfirmDialog from '@/components/ConfirmDialog'

type PhotoItem = {
    id: string
    file: File
    previewUrl: string
}

type PhotoType = 'official' | 'personal'

type SetlistItem = {
    id: string
    displayLabel: string
    title: string
    detail: string
    note: string
}

function NewEventPageContent() {
    const router = useRouter()

    const searchParams =
        useSearchParams()

    const returnToParameter =
        searchParams.get('returnTo')

    const returnTo =
        returnToParameter &&
            returnToParameter.startsWith('/')
            ? returnToParameter
            : '/'

    const supabase = createClient()

    const [eventDate, setEventDate] = useState('')
    const [title, setTitle] = useState('')

    const [mainVisual, setMainVisual] = useState<File | null>(null)
    const [mainVisualPreview, setMainVisualPreview] = useState<
        string | null
    >(null)

    const [
        mainVisualPositionX,
        setMainVisualPositionX,
    ] = useState(50)

    const [
        mainVisualPositionY,
        setMainVisualPositionY,
    ] = useState(50)

    const [seatBlockRow, setSeatBlockRow] = useState('')
    const [seatNumber, setSeatNumber] = useState('')
    const [venue, setVenue] = useState('')
    const [doorsTime, setDoorsTime] = useState('')
    const [startTime, setStartTime] = useState('')
    const [ticketPrice, setTicketPrice] = useState('')
    const [memo, setMemo] = useState('')
    const [officialUrl, setOfficialUrl] = useState('')

    const [artists, setArtists] = useState<string[]>([])
    const [artistInput, setArtistInput] = useState('')

    const [hashtags, setHashtags] = useState<string[]>([])
    const [hashtagInput, setHashtagInput] = useState('')

    const [setlistItems, setSetlistItems] = useState<SetlistItem[]>([])

    const [officialPhotos, setOfficialPhotos] = useState<PhotoItem[]>([])
    const [personalPhotos, setPersonalPhotos] = useState<PhotoItem[]>([])

    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [processingImages, setProcessingImages] = useState(false)
    const [
        showBackConfirmDialog,
        setShowBackConfirmDialog,
    ] = useState(false)

    const isDirty = useMemo(() => {
        return (
            eventDate !== '' ||
            title !== '' ||
            mainVisual !== null ||
            seatBlockRow !== '' ||
            seatNumber !== '' ||
            venue !== '' ||
            doorsTime !== '' ||
            startTime !== '' ||
            ticketPrice !== '' ||
            memo !== '' ||
            officialUrl !== '' ||
            setlistItems.length > 0 ||
            artists.length > 0 ||
            hashtags.length > 0 ||
            officialPhotos.length > 0 ||
            personalPhotos.length > 0
        )
    }, [
        eventDate,
        title,
        mainVisual,
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
        officialPhotos,
        personalPhotos,
    ])

    useEffect(() => {
        if (!mainVisual) {
            setMainVisualPreview(null)
            return
        }

        const previewUrl = URL.createObjectURL(mainVisual)
        setMainVisualPreview(previewUrl)

        return () => {
            URL.revokeObjectURL(previewUrl)
        }
    }, [mainVisual])

    useEffect(() => {
        return () => {
            officialPhotos.forEach((photo) => {
                URL.revokeObjectURL(photo.previewUrl)
            })

            personalPhotos.forEach((photo) => {
                URL.revokeObjectURL(photo.previewUrl)
            })
        }
    }, [])

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

    async function handleMainVisualChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        if (!file.type.startsWith('image/')) {
            setErrorMessage('画像ファイルを選択してください。')
            event.target.value = ''
            return
        }

        try {
            setProcessingImages(true)
            setErrorMessage('')

            const compressedFile = await compressImage(file)

            setMainVisual(compressedFile)
            setMainVisualPositionX(50)
            setMainVisualPositionY(50)

        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : '画像の処理に失敗しました。'
            )
        } finally {
            setProcessingImages(false)
            event.target.value = ''
        }
    }

    function handleMainVisualDelete() {
        setMainVisual(null)
        setMainVisualPositionX(50)
        setMainVisualPositionY(50)
    }

    async function handlePhotoChange(
        event: ChangeEvent<HTMLInputElement>,
        photoType: PhotoType
    ) {
        const selectedFiles = Array.from(event.target.files ?? [])

        if (selectedFiles.length === 0) {
            return
        }

        const currentPhotos =
            photoType === 'official'
                ? officialPhotos
                : personalPhotos

        const maxCount = photoType === 'official' ? 20 : 5
        const remainingCount = maxCount - currentPhotos.length

        if (remainingCount <= 0) {
            setErrorMessage(
                photoType === 'official'
                    ? 'OFFICIAL PHOTOSは最大20枚まで登録できます。'
                    : 'MY PHOTOSは最大5枚まで登録できます。'
            )

            event.target.value = ''
            return
        }

        if (selectedFiles.length > remainingCount) {
            setErrorMessage(
                photoType === 'official'
                    ? `OFFICIAL PHOTOSはあと${remainingCount}枚まで追加できます。`
                    : `MY PHOTOSはあと${remainingCount}枚まで追加できます。`
            )

            event.target.value = ''
            return
        }

        try {
            setProcessingImages(true)
            setErrorMessage('')

            const newPhotos: PhotoItem[] = []

            for (const file of selectedFiles) {
                if (!file.type.startsWith('image/')) {
                    throw new Error('画像ファイルを選択してください。')
                }

                const compressedFile = await compressImage(file)
                const previewUrl = URL.createObjectURL(compressedFile)

                newPhotos.push({
                    id: crypto.randomUUID(),
                    file: compressedFile,
                    previewUrl,
                })
            }

            if (photoType === 'official') {
                setOfficialPhotos((current) => [
                    ...current,
                    ...newPhotos,
                ])
            } else {
                setPersonalPhotos((current) => [
                    ...current,
                    ...newPhotos,
                ])
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : '画像の処理に失敗しました。'
            )
        } finally {
            setProcessingImages(false)
            event.target.value = ''
        }
    }

    function handlePhotoDelete(
        photoType: PhotoType,
        photoId: string
    ) {
        if (photoType === 'official') {
            setOfficialPhotos((current) => {
                const target = current.find(
                    (photo) => photo.id === photoId
                )

                if (target) {
                    URL.revokeObjectURL(target.previewUrl)
                }

                return current.filter(
                    (photo) => photo.id !== photoId
                )
            })
        } else {
            setPersonalPhotos((current) => {
                const target = current.find(
                    (photo) => photo.id === photoId
                )

                if (target) {
                    URL.revokeObjectURL(target.previewUrl)
                }

                return current.filter(
                    (photo) => photo.id !== photoId
                )
            })
        }
    }

    function addArtist() {
        const value = artistInput.trim()

        if (!value) {
            return
        }

        const alreadyExists = artists.some(
            (artist) => artist.toLowerCase() === value.toLowerCase()
        )

        if (alreadyExists) {
            setArtistInput('')
            return
        }

        setArtists((current) => [...current, value])
        setArtistInput('')
    }

    function deleteArtist(index: number) {
        setArtists((current) =>
            current.filter((_, currentIndex) => currentIndex !== index)
        )
    }

    function addHashtag() {
        const value = hashtagInput.trim()

        if (!value) {
            return
        }

        const alreadyExists = hashtags.some(
            (tag) => tag.toLowerCase() === value.toLowerCase()
        )

        if (alreadyExists) {
            setHashtagInput('')
            return
        }

        setHashtags((current) => [...current, value])
        setHashtagInput('')
    }

    function deleteHashtag(index: number) {
        setHashtags((current) =>
            current.filter((_, currentIndex) => currentIndex !== index)
        )
    }

    function copyArtistsToHashtags() {
        setHashtags([...artists])
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

    function moveSetlistItem(id: string, direction: 'up' | 'down') {
        setSetlistItems((current) => {
            const index = current.findIndex((item) => item.id === id)

            if (index === -1) {
                return current
            }

            const targetIndex =
                direction === 'up' ? index - 1 : index + 1

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

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault()

        setLoading(true)
        setErrorMessage('')

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            setErrorMessage(
                'ログイン情報を取得できませんでした。'
            )
            setLoading(false)
            return
        }

        const { data: createdEvent, error: insertError } =
            await supabase
                .from('events')
                .insert({
                    user_id: user.id,
                    event_date: eventDate,
                    title: title.trim(),

                    main_visual_position_x:
                        mainVisualPositionX,

                    main_visual_position_y:
                        mainVisualPositionY,

                    seat_block_row:
                        seatBlockRow.trim() || null,
                    seat_number:
                        seatNumber.trim() || null,
                    venue: venue.trim() || null,
                    doors_time: doorsTime || null,
                    start_time: startTime || null,
                    ticket_price:
                        ticketPrice.trim() || null,
                    memo: memo.trim() || null,
                    official_url: officialUrl.trim() || null,
                })
                .select('id')
                .single()

        if (insertError || !createdEvent) {
            setErrorMessage(
                `イベントの保存に失敗しました：${insertError?.message ?? 'Unknown error'
                }`
            )
            setLoading(false)
            return
        }

        const createdEventId = createdEvent.id

        const uploadedPaths: string[] = []

        async function rollbackNewEvent() {
            if (uploadedPaths.length > 0) {
                await supabase.storage
                    .from('event-images')
                    .remove(uploadedPaths)
            }

            await supabase
                .from('events')
                .delete()
                .eq('id', createdEventId)
        }

        try {
            if (mainVisual) {
                const storagePath =
                    `${user.id}/events/${createdEventId}` +
                    '/main/main-visual.webp'

                const { error: uploadError } =
                    await supabase.storage
                        .from('event-images')
                        .upload(storagePath, mainVisual, {
                            upsert: true,
                            contentType: 'image/webp',
                        })

                if (uploadError) {
                    throw new Error(
                        `MAIN VISUALの保存に失敗しました：${uploadError.message}`
                    )
                }

                uploadedPaths.push(storagePath)

                const { error: updateError } =
                    await supabase
                        .from('events')
                        .update({
                            main_visual_path: storagePath,
                        })
                        .eq('id', createdEventId)

                if (updateError) {
                    throw new Error(
                        `MAIN VISUAL情報の保存に失敗しました：${updateError.message}`
                    )
                }
            }

            const photoRows: {
                event_id: string
                photo_type: PhotoType
                storage_path: string
                sort_order: number
            }[] = []

            for (
                let index = 0;
                index < officialPhotos.length;
                index++
            ) {
                const photo = officialPhotos[index]

                const storagePath =
                    `${user.id}/events/${createdEventId}` +
                    `/official/${String(index + 1).padStart(
                        2,
                        '0'
                    )}.webp`

                const { error: uploadError } =
                    await supabase.storage
                        .from('event-images')
                        .upload(storagePath, photo.file, {
                            upsert: false,
                            contentType: 'image/webp',
                        })

                if (uploadError) {
                    throw new Error(
                        `OFFICIAL PHOTOSの保存に失敗しました：${uploadError.message}`
                    )
                }

                uploadedPaths.push(storagePath)

                photoRows.push({
                    event_id: createdEventId,
                    photo_type: 'official',
                    storage_path: storagePath,
                    sort_order: index,
                })
            }

            for (
                let index = 0;
                index < personalPhotos.length;
                index++
            ) {
                const photo = personalPhotos[index]

                const storagePath =
                    `${user.id}/events/${createdEventId}` +
                    `/personal/${String(index + 1).padStart(
                        2,
                        '0'
                    )}.webp`

                const { error: uploadError } =
                    await supabase.storage
                        .from('event-images')
                        .upload(storagePath, photo.file, {
                            upsert: false,
                            contentType: 'image/webp',
                        })

                if (uploadError) {
                    throw new Error(
                        `MY PHOTOSの保存に失敗しました：${uploadError.message}`
                    )
                }

                uploadedPaths.push(storagePath)

                photoRows.push({
                    event_id: createdEventId,
                    photo_type: 'personal',
                    storage_path: storagePath,
                    sort_order: index,
                })
            }

            if (photoRows.length > 0) {
                const { error: photoInsertError } =
                    await supabase
                        .from('event_photos')
                        .insert(photoRows)

                if (photoInsertError) {
                    throw new Error(
                        `PHOTO情報の保存に失敗しました：${photoInsertError.message}`
                    )
                }
            }

            const validSetlistItems = setlistItems.filter(
                (item) => item.title.trim() !== ''
            )

            if (validSetlistItems.length > 0) {
                const setlistRows = validSetlistItems.map(
                    (item, index) => ({
                        event_id: createdEventId,
                        position: index + 1,
                        display_label: item.displayLabel.trim() || null,
                        title: item.title.trim(),
                        detail: item.detail.trim() || null,
                        note: item.note.trim() || null,
                    })
                )

                const { error: setlistInsertError } = await supabase
                    .from('setlist_items')
                    .insert(setlistRows)

                if (setlistInsertError) {
                    throw new Error(
                        `SETLIST情報の保存に失敗しました：${setlistInsertError.message}`
                    )
                }
            }

            if (artists.length > 0) {
                const artistRows = artists.map((artist, index) => ({
                    event_id: createdEventId,
                    name: artist,
                    sort_order: index,
                }))

                const { error: artistInsertError } = await supabase
                    .from('event_artists')
                    .insert(artistRows)

                if (artistInsertError) {
                    throw new Error(
                        `ARTIST情報の保存に失敗しました：${artistInsertError.message}`
                    )
                }
            }

            if (hashtags.length > 0) {
                const hashtagRows = hashtags.map((tag, index) => ({
                    event_id: createdEventId,
                    tag,
                    sort_order: index,
                }))

                const { error: hashtagInsertError } = await supabase
                    .from('event_hashtags')
                    .insert(hashtagRows)

                if (hashtagInsertError) {
                    throw new Error(
                        `HASHTAG情報の保存に失敗しました：${hashtagInsertError.message}`
                    )
                }
            }

            router.replace(
                `/events/${createdEventId}?returnTo=${encodeURIComponent(returnTo)}`
            )
        } catch (error) {
            await rollbackNewEvent()

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : '保存処理に失敗しました。'
            )

            setLoading(false)
        }
    }

    function goBack() {
        router.push(returnTo)
    }

    function handleBack() {
        if (isDirty) {
            setShowBackConfirmDialog(true)
            return
        }

        goBack()
    }

    function getDisplayDomain(url: string) {
        try {
            return new URL(url).hostname.replace(/^www\./, '')
        } catch {
            return url
        }
    }

    return (
        <main
            className={`${styles.page} ${styles.pageEdit}`}
        >
            <form onSubmit={handleSubmit}>
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
                        予定を追加
                    </h1>

                    <button
                        type="submit"
                        aria-label="保存"
                        title="保存"
                        className={styles.saveButton}
                    >
                        <Save
                            size={27}
                            strokeWidth={2}
                        />
                    </button>
                </header>

                <section className={styles.topCard}>
                    <div
                        className={styles.dateTitleGrid}
                    >
                        <div>
                            <label
                                htmlFor="event-date"
                                className={
                                    styles.fieldLabel
                                }
                            >
                                DATE
                            </label>

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
                        </div>

                        <div>
                            <label
                                htmlFor="title"
                                className={
                                    styles.fieldLabel
                                }
                            >
                                TITLE
                            </label>

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
                        </div>
                    </div>
                </section>

                <section
                    className={`${styles.block} ${styles.mainVisualBlock}`}
                >
                    {mainVisualPreview ? (
                        <MainVisualFrame
                            src={mainVisualPreview}
                            alt="MAIN VISUAL preview"
                            editable={true}
                            positionX={mainVisualPositionX}
                            positionY={mainVisualPositionY}
                            onPositionChange={(x, y) => {
                                setMainVisualPositionX(x)
                                setMainVisualPositionY(y)
                            }}
                            onDelete={handleMainVisualDelete}
                        />
                    ) : (
                        <label
                            className={styles.addVisualButton}
                        >
                            メインビジュアルを追加

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleMainVisualChange}
                                hidden
                            />
                        </label>
                    )}
                </section>

                <section className={styles.block}>
                    <div
                        className={styles.blockHeader}
                    >
                        <h2
                            className={styles.blockTitle}
                        >
                            TICKET
                        </h2>
                    </div>

                    <div
                        className={styles.ticketGrid}
                    >
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
                </section>

                <section className={styles.block}>
                    <div className={styles.blockHeader}>
                        <h2 className={styles.blockTitle}>
                            PHOTO
                        </h2>

                    </div>
                    <>
                        <div className={styles.photoSection}>
                            <h3 className={styles.photoLabel}>
                                OFFICIAL PHOTOS (
                                {officialPhotos.length}/20)
                            </h3>

                            <div className={styles.photoTrack}>
                                {officialPhotos.map(
                                    (photo) => (
                                        <div
                                            key={photo.id}
                                            className={
                                                styles.photoItem
                                            }
                                        >
                                            <img
                                                src={photo.previewUrl}
                                                alt="OFFICIAL PHOTO preview"
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
                                                    handlePhotoDelete(
                                                        'official',
                                                        photo.id
                                                    )
                                                }
                                                aria-label="画像を削除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )
                                )}

                                {officialPhotos.length < 20 && (
                                    <label
                                        className={styles.photoAdd}
                                    >
                                        ＋

                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(event) =>
                                                handlePhotoChange(
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
                                {personalPhotos.length}/5)
                            </h3>

                            <div className={styles.photoTrack}>
                                {personalPhotos.map(
                                    (photo) => (
                                        <div
                                            key={photo.id}
                                            className={
                                                styles.photoItem
                                            }
                                        >
                                            <img
                                                src={photo.previewUrl}
                                                alt="MY PHOTO preview"
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
                                                    handlePhotoDelete(
                                                        'personal',
                                                        photo.id
                                                    )
                                                }
                                                aria-label="画像を削除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )
                                )}

                                {personalPhotos.length < 5 && (
                                    <label
                                        className={styles.photoAdd}
                                    >
                                        ＋

                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(event) =>
                                                handlePhotoChange(
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
                </section>

                <section className={styles.block}>
                    <div className={styles.blockHeader}>
                        <h2 className={styles.blockTitle}>
                            SETLIST
                        </h2>

                    </div>
                    <>
                        <div className={styles.setlistEditor}>
                            {setlistItems.map(
                                (item, index) => (
                                    <div
                                        key={item.id}
                                        className={
                                            styles.setlistEditItem
                                        }
                                    >
                                        <div
                                            className={
                                                styles.setlistEditTop
                                            }
                                        >
                                            <div className={styles.setlistNumberArea}>
                                                <span className={styles.setlistNumber}>
                                                    {String(index + 1).padStart(2, '0')}
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
                                                className={
                                                    styles.setlistFields
                                                }
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
                                                    className={
                                                        styles.setlistTitleInput
                                                    }
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
                                                    className={
                                                        styles.setlistDetailInput
                                                    }
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
                                                    className={
                                                        styles.setlistNoteInput
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div
                                            className={
                                                styles.setlistControls
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={
                                                    styles.setlistControlButton
                                                }
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
                                                className={
                                                    styles.setlistControlButton
                                                }
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
                                                className={
                                                    styles.setlistDeleteButton
                                                }
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
                            className={
                                styles.setlistAddButton
                            }
                            onClick={addSetlistItem}
                        >
                            項目を追加
                        </button>
                    </>

                </section>

                <section className={styles.block}>
                    <div className={styles.blockHeader}>
                        <h2 className={styles.blockTitle}>
                            MEMO
                        </h2>

                    </div>

                    <textarea
                        placeholder="メモを入力"
                        value={memo}
                        onChange={(event) =>
                            setMemo(event.target.value)
                        }
                        rows={3}
                        className={styles.memoInput}
                    />
                </section>

                <section className={styles.block}>
                    <div className={styles.blockHeader}>
                        <h2 className={styles.blockTitle}>
                            OFFICIAL WEBSITE
                        </h2>

                    </div>
                    <input
                        type="url"
                        placeholder="URL"
                        value={officialUrl}
                        onChange={(event) =>
                            setOfficialUrl(event.target.value)
                        }
                        className={styles.officialUrlInput}
                    />
                </section>

                <section className={styles.block}>
                    <div className={styles.blockHeader}>
                        <h2 className={styles.blockTitle}>
                            ARTIST
                        </h2>

                    </div>
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
                </section>

                <section className={styles.block}>
                    <div className={styles.blockHeader}>
                        <h2 className={styles.blockTitle}>
                            HASHTAG
                        </h2>

                    </div>
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
                </section>

                {processingImages && (
                    <p>画像を処理しています...</p>
                )}

                {errorMessage && (
                    <p>{errorMessage}</p>
                )}

            </form>
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

export default function NewEventPage() {
    return (
        <Suspense
            fallback={
                <main
                    className={`${styles.page} ${styles.pageEdit}`}
                >
                    <p>読み込み中...</p>
                </main>
            }
        >
            <NewEventPageContent />
        </Suspense>
    )
}
