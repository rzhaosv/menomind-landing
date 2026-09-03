import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Noto_Serif, Manrope } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
  weight: ['400', '700'],
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const GADS_ID = 'AW-17830146300'
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID

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
    <html lang="en" className={`${inter.variable} ${notoSerif.variable} ${manrope.variable}`}>
      <head>
        <meta name="apple-itunes-app" content="app-id=6761165992" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'MenoMind: Menopause Tracker',
            operatingSystem: 'iOS',
            applicationCategory: 'HealthApplication',
            description: 'Perimenopause and menopause symptom tracker with an AI companion, personalized wellness plans and doctor-ready reports.',
            url: 'https://www.menomind.app',
            installUrl: 'https://apps.apple.com/app/id6761165992',
            offers: [
              { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free symptom tracking' },
              { '@type': 'Offer', price: '14.99', priceCurrency: 'USD', description: 'MenoMind Premium monthly, 7-day free trial' },
              { '@type': 'Offer', price: '79.99', priceCurrency: 'USD', description: 'MenoMind Premium yearly, 7-day free trial' },
            ],
            publisher: { '@type': 'Organization', name: 'MenoMind', url: 'https://www.menomind.app' },
          }) }}
        />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} font-sans`}>
        {children}
        {GA_ID && (
          <>
            <Script
              src={"https://www.googletagmanager.com/gtag/js?id=" + GA_ID}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {"window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '" + GA_ID + "');gtag('config', '" + GADS_ID + "');gtag('set', 'linker', {'domains': ['menomind.app']});"}
            </Script>
          </>
        )}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
          </Script>
        )}
        {CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${CLARITY_ID}");`}
          </Script>
        )}
      </body>
    </html>
  )
}
