/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração específica para Vercel
  output: 'standalone',
  
  // Otimizações para Vercel
  experimental: {
    serverComponentsExternalPackages: ['ioredis'],
    outputFileTracingRoot: undefined,
  },

  env: {
    NEXT_TELEMETRY_DISABLED: '1',
    VERCEL: '1',
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
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, X-Tenant-ID',
        },
      ],
    },
  ],

  // Rewrites para compatibilidade
  async rewrites() {
    return [
      {
        source: '/webhook/:path*',
        destination: '/api/webhooks/:path*',
      },
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },

  // Configurações específicas para Vercel
  webpack: (config, { isServer }) => {
    // Configurações para certificados no Vercel
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;