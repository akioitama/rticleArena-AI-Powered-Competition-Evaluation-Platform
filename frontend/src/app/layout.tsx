import type { Metadata } from 'next';
import { Bebas_Neue, Syne, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'ArticleArena — AI-Powered Writing Competition',
  description: 'Submit articles. Get scored by AI. Rise through the ranks.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebas.variable} ${syne.variable} ${jetbrains.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={syne.className} style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
