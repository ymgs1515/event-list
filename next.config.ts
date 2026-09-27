import { spawnSync } from 'node:child_process'
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const revision =
  spawnSync(
    'git',
    ['rev-parse', 'HEAD'],
    { encoding: 'utf-8' }
  ).stdout.trim() || 'dev'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',

  additionalPrecacheEntries: [
    {
      url: '/offline.html',
      revision,
    },
    {
      url: '/manifest.webmanifest',
      revision,
    },
    {
      url: '/icons/icon-192.png',
      revision,
    },
    {
      url: '/icons/icon-512.png',
      revision,
    },
    {
      url: '/icons/icon-maskable-512.png',
      revision,
    },
    {
      url: '/icons/apple-touch-icon.png',
      revision,
    },
  ],

  disable:
    process.env.NODE_ENV ===
    'development',
})

const nextConfig: NextConfig = {}

export default withSerwist(nextConfig)
