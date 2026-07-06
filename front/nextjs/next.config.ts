import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    turbopack: {
        root: path.join(__dirname),
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
        ],
        unoptimized: true,
    },
};

export default nextConfig;