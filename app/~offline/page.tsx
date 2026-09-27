import Image from 'next/image'

export default function OfflinePage() {
    return (
        <main
            style={{
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: '#eeeeee',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '360px',
                    padding: '40px 24px',
                    textAlign: 'center',
                }}
            >
                <Image
                    src="/icons/icon-192.png"
                    alt=""
                    width={96}
                    height={96}
                    unoptimized
                    priority
                    style={{
                        display: 'block',
                        margin: '0 auto 24px',
                        borderRadius: '20px',
                    }}
                />

                <h1
                    style={{
                        margin: '0 0 10px',
                        fontSize: '20px',
                        fontWeight: 700,
                    }}
                >
                    オフラインです。
                </h1>
            </div>
        </main>
    )
}
