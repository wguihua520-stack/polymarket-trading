import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Polymarket Trading System',
  description: 'Automated trading system for Polymarket with rapid drop hedging strategy',
  keywords: ['Polymarket', 'Trading', 'Hedging', 'Arbitrage', 'Bitcoin'],
  authors: [{ name: 'Trading Team' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
