import type { NextConfig } from 'next';
import path from 'path';
import { readFileSync } from 'fs';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: path.resolve(__dirname, '../../.env') });

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
) as { version: string };

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_UPDATE_SERVER_URL: process.env.NEXT_PUBLIC_UPDATE_SERVER_URL,
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
