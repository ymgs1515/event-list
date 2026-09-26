export async function compressImage(file: File): Promise<File> {
    const image = await loadImage(file)

    const maxSize = 1600

    let width = image.naturalWidth
    let height = image.naturalHeight

    if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height)

        width = Math.round(width * scale)
        height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')

    if (!context) {
        throw new Error('画像の変換処理を開始できませんでした。')
    }

    context.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (result) => {
                if (result) {
                    resolve(result)
                } else {
                    reject(new Error('画像の圧縮に失敗しました。'))
                }
            },
            'image/webp',
            0.82
        )
    })

    const baseName =
        file.name.replace(/\.[^/.]+$/, '') || 'image'

    return new File(
        [blob],
        `${baseName}.webp`,
        {
            type: 'image/webp',
            lastModified: Date.now(),
        }
    )
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        const objectUrl = URL.createObjectURL(file)

        image.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(image)
        }

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(
                new Error(
                    'この画像形式をブラウザで読み込めませんでした。'
                )
            )
        }

        image.src = objectUrl
    })
}
