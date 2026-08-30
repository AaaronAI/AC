/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Market images come from Polymarket's CDN; they're only ever rendered as
  // plain <img>, so no remotePatterns config is needed.
};

export default nextConfig;
