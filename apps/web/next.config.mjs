import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(configDir, '../..'),
  experimental: {
    externalDir: true
  },
  transpilePackages: ['@spendwise/shared', '@spendwise/ui']
};

export default nextConfig;
