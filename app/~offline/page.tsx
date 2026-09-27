export default function OfflinePage() {
    return (
        <main
            style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: '#eeeeee',
            }}
        >
            <img
                src="/icons/icon-192.png"
                alt="推活ログ"
                width="96"
                height="96"
                style={{
                    display: 'block',
                    width: '96px',
                    height: '96px',
                    marginBottom: '28px',
                    borderRadius: '20px',
                }}
            />

            <p
                style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 500,
                }}
            >
                オフラインです。
            </p>
        </main>
    )
}
