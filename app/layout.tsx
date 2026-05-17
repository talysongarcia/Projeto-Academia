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
  title: 'Volt Performance',
  description: 'Rastreamento de fitness de alta performance',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
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
