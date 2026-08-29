import type { NextConfig } from 'next';
import { resolveAirmaxApiUrl } from './lib/config';

if (process.env.NODE_ENV === 'production') {
  resolveAirmaxApiUrl();
}

const config: NextConfig = { turbopack: { root: process.cwd() } };
export default config;
