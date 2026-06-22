/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Redireciona o endereço antigo (.vercel.app) para o domínio oficial
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'nr1-saas.vercel.app' }],
        destination: 'https://plataformazelo.com.br/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
