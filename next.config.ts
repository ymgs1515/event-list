import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',

  /*
   * 開発中はService Workerを無効化。
   * 古いキャッシュが開発確認を邪魔するのを防ぐ。
   */
  disable:
    process.env.NODE_ENV ===
    'development',
})

const nextConfig: NextConfig = {}

export default withSerwist(nextConfig)
