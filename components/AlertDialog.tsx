'use client'

type Props = {
    open: boolean
    message: string
    onClose: () => void
}

export default function AlertDialog({
    open,
    message,
    onClose,
}: Props) {
    if (!open) {
        return null
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                background:
                    'rgba(0, 0, 0, 0.38)',
            }}
        >
            <div
                style={{
                    width:
                        'calc(100% - 48px)',
                    maxWidth: '360px',

                    padding:
                        '22px 20px 16px',

                    background: '#ffffff',
                    borderRadius: '12px',

                    boxShadow:
                        '0 8px 28px rgba(0, 0, 0, 0.18)',
                }}
            >
                <p
                    style={{
                        margin: 0,

                        color: '#222222',

                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: 1.7,
                    }}
                >
                    {message}
                </p>

                <div
                    style={{
                        display: 'flex',
                        justifyContent:
                            'flex-end',

                        marginTop: '18px',
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            minWidth: '56px',
                            height: '34px',
                            padding: '0 12px',

                            color: '#333333',

                            fontSize: '13px',
                            fontWeight: 600,

                            background:
                                '#eeeeee',
                            border: 0,
                            borderRadius:
                                '6px',

                            cursor: 'pointer',
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}

