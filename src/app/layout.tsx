import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
    title: 'MenoMind — AI-Powered Menopause Companion',
    description:
          'Personalized AI chat, daily symptom tracking, and actionable wellness plans to help you navigate perimenopause and menopause with confidence.',
    openGraph: {
          title: 'MenoMind — AI-Powered Menopause Companion',
          description:
                  'Personalized AI chat, daily symptom tracking, and actionable wellness plans for perimenopause and menopause.',
          url: 'https://menomind.app',
          siteName: 'MenoMind',
          type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
          <html lang="en">
                <head>
                        <link rel="preconnect" href="https://fonts.googleapis.com" />
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                        <link
                                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                                    rel="stylesheet"
                                  />
                  {process.env.NEXT_PUBLIC_GA_ID && (
                      <>
                                  <Script
                                                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                                                  strategy="afterInteractive"
                                                />
                                  <Script id="google-analytics" strategy="afterInteractive">
                                    {`
                                                    window.dataLayer = window.dataLayer || [];
                                                                    function gtag(){dataLayer.push(arguments);}
                                                                                    gtag('js', new Date());
                                                                                                    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                                                                                                                  `}
                                  </Script>Script>
                      </>>
                    )}
                </head>head>
                <body className="font-sans">{children}</body>body>
          </html>html>
        )
}</></html>
