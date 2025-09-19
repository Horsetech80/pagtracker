/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  
  // 🔧 CORREÇÃO PRODUÇÃO: Configurar renderização adequada
  experimental: {
    outputFileTracingRoot: undefined,
    serverComponentsExternalPackages: ['ioredis'],
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
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ],
    },
  ],
  // 🌐 PRODUÇÃO: Configuração de proxy para webhooks
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [];
    }
    
    return [
      {
        source: '/api/webhooks/:path*',
        destination: 'http://pagtracker-webhooks:3001/:path*',
      },
    ];
  },

  // Configuração do webpack para garantir path mapping
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

    // Garantir que o path mapping funcione corretamente
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };

    return config;
  },
};

module.exports = nextConfig;
