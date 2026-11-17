import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/presentation/components/Sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Stock-tock | Gestión Comercial e Inventario',
  description: 'Plataforma configurable de gestión comercial e inventario para PyMEs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="h-full bg-[#09090b] text-zinc-100 flex overflow-hidden font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#09090b]">
          {children}
        </main>
      </body>
    </html>
  );
}
