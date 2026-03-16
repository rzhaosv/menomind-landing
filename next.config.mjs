/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/symptoms',
        destination: '/track',
        permanent: true,
      },
      {
        source: '/quiz',
        destination: '/quiz.html',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
