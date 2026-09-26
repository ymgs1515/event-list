'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

import styles from './ImageViewer.module.css'

type ImageViewerProps = {
    src: string
    alt: string
    onClose: () => void
}

export default function ImageViewer({
    src,
    alt,
    onClose,
}: ImageViewerProps) {
    useEffect(() => {
        const previousOverflow =
            document.body.style.overflow

        document.body.style.overflow = 'hidden'

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener(
            'keydown',
            handleKeyDown
        )

        return () => {
            document.body.style.overflow =
                previousOverflow

            window.removeEventListener(
                'keydown',
                handleKeyDown
            )
        }
    }, [onClose])

    return (
        <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
        >
            <div className={styles.imageWrap}>
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="画像を閉じる"
                >
                    <X
                        size={24}
                        strokeWidth={2}
                    />
                </button>

                <img
                    src={src}
                    alt={alt}
                    className={styles.image}
                />
            </div>
        </div>
    )
}
