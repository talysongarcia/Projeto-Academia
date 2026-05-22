import type {Metadata} from 'next';
import { Inter, Anybody, Lexend } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const anybody = Anybody({
  subsets: ['latin'],
  variable: '--font-anybody',
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
});

export const metadata: Metadata = {
  title: 'Treino Fofo',
  description: 'Acompanhamento de treinos de alta performance',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Treino Fofo',
  },
  icons: {
    icon: '/api/favicon',
    shortcut: '/api/favicon',
    apple: '/api/favicon',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Treino Fofo" />
        <link rel="apple-touch-icon" href="/api/favicon" />
      </head>
      <body
        className={`${inter.variable} ${anybody.variable} ${lexend.variable} font-lexend bg-[#131313] text-[#e5e2e1] antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
