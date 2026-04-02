/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: ['@spendwise/shared', '@spendwise/ui']
};

export default nextConfig;
