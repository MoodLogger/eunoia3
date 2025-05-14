
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Eunoia',
  description: 'Track your mood and daily activities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl"> {/* Defaulting to Polish as many texts were hardcoded this way */}
      <body className={`${inter.className} antialiased`}>
        {/* Removed AuthProvider, LanguageSwitcher, NavigationLinks */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
