import type { Metadata } from 'next';
import './globals.css';
import { GardenProvider } from '../context/GardenContext';

export const metadata: Metadata = {
  title: 'KeyGarden — Hierarchical Account Abstraction Trees',
  description: 'Hierarchical account tree for Ethereum: root accounts issue departmental sub-accounts with policy narrowing and cascading atomic branch revocation. Built for Road to Devcon – IIITN Edition.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-gray-100 min-h-screen flex flex-col antialiased selection:bg-garden-500 selection:text-white">
        <GardenProvider>
          {children}
        </GardenProvider>
      </body>
    </html>
  );
}
