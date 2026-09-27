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
                    padding: '32px 24px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    textAlign: 'center',
                }}
            >
                <h1
                    style={{
                        margin: '0 0 12px',
                        fontSize: '20px',
                    }}
                >
                    オフラインです
                </h1>

                <p
                    style={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: 1.7,
                        color: '#555555',
                    }}
                >
                    現在ネットワークに接続されていません。
                    <br />
                    接続が戻ると再びデータを取得できます。
                </p>
            </div>
        </main>
    )
}
