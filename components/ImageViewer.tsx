'use client'

import { useEffect } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react'

import styles from './ImageViewer.module.css'

type ImageViewerProps = {
    src: string
    alt: string
    onClose: () => void
    onPrevious?: () => void
    onNext?: () => void
    hasPrevious?: boolean
    hasNext?: boolean
}

export default function ImageViewer({
    src,
    alt,
    onClose,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext,
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

            if (
                event.key === 'ArrowLeft' &&
                hasPrevious &&
                onPrevious
            ) {
                onPrevious()
            }

            if (
                event.key === 'ArrowRight' &&
                hasNext &&
                onNext
            ) {
                onNext()
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
    }, [
        onClose,
        onPrevious,
        onNext,
        hasPrevious,
        hasNext,
    ])

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

                {onPrevious && (
                    <button
                        type="button"
                        className={`${styles.navButton} ${styles.previousButton}`}
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                        aria-label="前の画像"
                    >
                        <ChevronLeft
                            size={28}
                            strokeWidth={2}
                        />
                    </button>
                )}

                {onNext && (
                    <button
                        type="button"
                        className={`${styles.navButton} ${styles.nextButton}`}
                        onClick={onNext}
                        disabled={!hasNext}
                        aria-label="次の画像"
                    >
                        <ChevronRight
                            size={28}
                            strokeWidth={2}
                        />
                    </button>
                )}
            </div>
        </div>
    )
}

