/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      // The invite flow merged into the employer dashboard (2026-08-28);
      // old links land where the form now lives.
      { source: "/invite", destination: "/employer", permanent: true },
    ];
  },
};

module.exports = nextConfig;
