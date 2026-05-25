import type { NextConfig } from 'next';
import path from 'path';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: path.resolve(__dirname, '../../.env') });

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_UPDATE_SERVER_URL: process.env.NEXT_PUBLIC_UPDATE_SERVER_URL,
  },
};

export default nextConfig;
