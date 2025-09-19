/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: '.next-admin', // Diretório separado para o painel admin
  // Middleware é controlado via variável de ambiente NEXT_PUBLIC_ADMIN_MODE
  experimental: {
    outputFileTracingRoot: undefined,
  },
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  // Otimizações de produção
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  swcMinify: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  // Headers de segurança
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};

module.exports = nextConfig;