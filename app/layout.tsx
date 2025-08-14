import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { SWRProvider } from '@/components/providers/SWRProvider'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tunda Sports Club - Village Cricket Ground in Kutch, Gujarat',
  description: 'Welcome to Tunda Sports Club, the village cricket ground in Tunda, Kutch district, Gujarat. Local cricket tournaments, community events, and cricket activities in our beautiful village.',
  keywords: ['cricket', 'village cricket', 'Tunda cricket ground', 'Kutch cricket', 'Gujarat village cricket', 'Mundra taluka cricket', 'local tournaments'],
  authors: [{ name: 'Tunda Sports Club' }],
  openGraph: {
    title: 'Tunda Sports Club - Village Cricket Ground in Kutch',
    description: 'Local cricket ground serving Tunda village and surrounding areas in Kutch district',
    type: 'website',
    url: 'https://tundasportsclub.com',
    siteName: 'Tunda Sports Club',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tunda Sports Club - Village Cricket Ground',
    description: 'Local cricket activities and tournaments in Tunda village, Kutch',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  metadataBase: new URL('http://localhost:3000'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tunda Sports Club" />
        <link rel="apple-touch-icon" href="/logo.PNG" />
      </head>
      <body className={inter.className}>
        <SWRProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <ServiceWorkerRegistration />
          </ThemeProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
