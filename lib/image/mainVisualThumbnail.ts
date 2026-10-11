export function getMainVisualThumbnailPath(
    mainVisualPath: string
) {
    const slashIndex =
        mainVisualPath.lastIndexOf('/')

    const directory =
        slashIndex >= 0
            ? mainVisualPath.slice(0, slashIndex + 1)
            : ''

    return `${directory}main-visual-thumb.webp`
}
