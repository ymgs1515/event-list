'use client'

import {
    PointerEvent as ReactPointerEvent,
    useRef,
    useState,
} from 'react'

import ImageViewer from './ImageViewer'
import styles from './MainVisualFrame.module.css'

type MainVisualFrameProps = {
    src: string
    alt?: string

    editable: boolean

    positionX: number
    positionY: number

    onPositionChange?: (
        x: number,
        y: number
    ) => void

    onDelete?: () => void
}

type DragState = {
    pointerId: number
    startClientX: number
    startClientY: number
    startPositionX: number
    startPositionY: number
}

function clamp(value: number) {
    return Math.min(
        100,
        Math.max(0, value)
    )
}

export default function MainVisualFrame({
    src,
    alt = 'MAIN VISUAL',
    editable,
    positionX,
    positionY,
    onPositionChange,
    onDelete,
}: MainVisualFrameProps) {
    const frameRef =
        useRef<HTMLDivElement | null>(null)

    const imageRef =
        useRef<HTMLImageElement | null>(null)

    const dragStateRef =
        useRef<DragState | null>(null)

    const [
        viewerOpen,
        setViewerOpen,
    ] = useState(false)

    function handlePointerDown(
        event: ReactPointerEvent<HTMLDivElement>
    ) {
        if (
            !editable ||
            !onPositionChange
        ) {
            return
        }

        dragStateRef.current = {
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startPositionX: positionX,
            startPositionY: positionY,
        }

        event.currentTarget.setPointerCapture(
            event.pointerId
        )
    }

    function handlePointerMove(
        event: ReactPointerEvent<HTMLDivElement>
    ) {
        const dragState =
            dragStateRef.current

        const frame =
            frameRef.current

        const image =
            imageRef.current

        if (
            !dragState ||
            !frame ||
            !image ||
            !onPositionChange
        ) {
            return
        }

        const frameRect =
            frame.getBoundingClientRect()

        if (
            image.naturalWidth === 0 ||
            image.naturalHeight === 0
        ) {
            return
        }

        const scale = Math.max(
            frameRect.width /
            image.naturalWidth,
            frameRect.height /
            image.naturalHeight
        )

        const renderedWidth =
            image.naturalWidth * scale

        const renderedHeight =
            image.naturalHeight * scale

        const overflowX = Math.max(
            0,
            renderedWidth -
            frameRect.width
        )

        const overflowY = Math.max(
            0,
            renderedHeight -
            frameRect.height
        )

        const deltaX =
            event.clientX -
            dragState.startClientX

        const deltaY =
            event.clientY -
            dragState.startClientY

        let nextX =
            dragState.startPositionX

        let nextY =
            dragState.startPositionY

        if (overflowX > 0.5) {
            nextX = clamp(
                dragState.startPositionX -
                (deltaX /
                    overflowX) *
                100
            )
        }

        if (overflowY > 0.5) {
            nextY = clamp(
                dragState.startPositionY -
                (deltaY /
                    overflowY) *
                100
            )
        }

        onPositionChange(
            nextX,
            nextY
        )
    }

    function finishDrag(
        event: ReactPointerEvent<HTMLDivElement>
    ) {
        if (
            dragStateRef.current &&
            event.currentTarget.hasPointerCapture(
                event.pointerId
            )
        ) {
            event.currentTarget.releasePointerCapture(
                event.pointerId
            )
        }

        dragStateRef.current = null
    }

    return (
        <>
            <div
                className={styles.wrapper}
            >
                <div
                    ref={frameRef}
                    className={`${styles.frame} ${editable
                            ? styles.editable
                            : styles.view
                        }`}
                    onPointerDown={
                        handlePointerDown
                    }
                    onPointerMove={
                        handlePointerMove
                    }
                    onPointerUp={finishDrag}
                    onPointerCancel={
                        finishDrag
                    }
                >
                    {editable ? (
                        <img
                            ref={imageRef}
                            src={src}
                            alt={alt}
                            draggable={false}
                            className={
                                styles.image
                            }
                            style={{
                                objectPosition:
                                    `${positionX}% ${positionY}%`,
                            }}
                        />
                    ) : (
                        <button
                            type="button"
                            className={
                                styles.viewerButton
                            }
                            onClick={() =>
                                setViewerOpen(
                                    true
                                )
                            }
                            aria-label="画像を拡大表示"
                        >
                            <img
                                ref={imageRef}
                                src={src}
                                alt={alt}
                                draggable={
                                    false
                                }
                                className={
                                    styles.image
                                }
                                style={{
                                    objectPosition:
                                        `${positionX}% ${positionY}%`,
                                }}
                            />
                        </button>
                    )}

                    {editable &&
                        onDelete && (
                            <button
                                type="button"
                                className={
                                    styles.deleteButton
                                }
                                onPointerDown={(
                                    event
                                ) =>
                                    event.stopPropagation()
                                }
                                onClick={
                                    onDelete
                                }
                                aria-label="メインビジュアルを削除"
                            >
                                ×
                            </button>
                        )}
                </div>

                {editable && (
                    <p
                        className={
                            styles.dragHint
                        }
                    >
                        ドラッグして表示位置を調整
                    </p>
                )}
            </div>

            {viewerOpen && (
                <ImageViewer
                    src={src}
                    alt={alt}
                    onClose={() =>
                        setViewerOpen(false)
                    }
                />
            )}
        </>
    )
}
