'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import AlertDialog from '@/components/AlertDialog'

type Props = {
    eventId: string
    returnTo: string
    className?: string
}

export default function DeleteEventButton({
    eventId,
    returnTo,
    className,
}: Props) {
    const router = useRouter()
    const supabase = createClient()

    const [confirming, setConfirming] =
        useState(false)

    const [deleting, setDeleting] =
        useState(false)

    const [errorMessage, setErrorMessage] =
        useState('')

    const [
        alertMessage,
        setAlertMessage,
    ] = useState('')

    async function deleteEvent() {
        setDeleting(true)
        setErrorMessage('')

        /*
         * MAIN VISUALのパスを取得
         */
        const {
            data: eventData,
            error: eventError,
        } = await supabase
            .from('events')
            .select('main_visual_path')
            .eq('id', eventId)
            .single()

        if (eventError || !eventData) {
            setErrorMessage(
                'イベント情報を取得できませんでした。'
            )
            setDeleting(false)
            return
        }

        /*
         * PHOTOのStorageパスを取得
         */
        const {
            data: photoData,
            error: photoError,
        } = await supabase
            .from('event_photos')
            .select('storage_path')
            .eq('event_id', eventId)

        if (photoError) {
            setErrorMessage(
                `PHOTO情報を取得できませんでした：${photoError.message}`
            )
            setDeleting(false)
            return
        }

        const storagePaths: string[] = []

        if (eventData.main_visual_path) {
            storagePaths.push(
                eventData.main_visual_path
            )
        }

        for (const photo of photoData ?? []) {
            storagePaths.push(
                photo.storage_path
            )
        }

        /*
         * イベントをDBから削除
         *
         * 関連する
         * setlist_items
         * event_artists
         * event_hashtags
         * event_photos
         *
         * はON DELETE CASCADEで削除される
         */
        const { error: deleteError } =
            await supabase
                .from('events')
                .delete()
                .eq('id', eventId)

        if (deleteError) {
            setErrorMessage(
                `イベントの削除に失敗しました：${deleteError.message}`
            )
            setDeleting(false)
            return
        }

        /*
         * Storage画像を削除
         */
        if (storagePaths.length > 0) {
            const { error: storageError } =
                await supabase.storage
                    .from('event-images')
                    .remove(storagePaths)

            if (storageError) {
                setDeleting(false)
                setConfirming(false)

                setAlertMessage(
                    'イベントは削除されましたが、画像ファイルの一部を削除できませんでした。'
                )

                return
            }
        }

        setConfirming(false)

        router.replace(returnTo)
    }

    return (
        <>
            <button
                type="button"
                className={className}
                onClick={() =>
                    setConfirming(true)
                }
            >
                <Trash2
                    size={16}
                    strokeWidth={1.8}
                />

                <span>イベントを削除</span>
            </button>

            <ConfirmDialog
                open={confirming}
                message={
                    errorMessage
                        ? errorMessage
                        : deleting
                            ? 'イベントを削除しています...'
                            : 'このイベントを削除しますか？'
                }
                onCancel={() => {
                    if (deleting) {
                        return
                    }

                    setConfirming(false)
                    setErrorMessage('')
                }}
                onConfirm={() => {
                    if (deleting) {
                        return
                    }

                    void deleteEvent()
                }}
            />
            <AlertDialog
                open={alertMessage !== ''}
                message={alertMessage}
                onClose={() => {
                    setAlertMessage('')
                    router.replace(returnTo)
                }}
            />
        </>
    )
}

