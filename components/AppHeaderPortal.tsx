'use client'

import {
    ReactNode,
    useEffect,
    useState,
} from 'react'
import { createPortal } from 'react-dom'

type Props = {
    children: ReactNode
}

export default function AppHeaderPortal({
    children,
}: Props) {
    const [
        target,
        setTarget,
    ] = useState<HTMLElement | null>(
        null
    )

    useEffect(() => {
        setTarget(
            document.getElementById(
                'app-header'
            )
        )
    }, [])

    if (!target) {
        return null
    }

    return createPortal(
        children,
        target
    )
}

