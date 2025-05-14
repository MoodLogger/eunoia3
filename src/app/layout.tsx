
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider
import { NavigationLinks } from '@/components/navigation-links'; // Import NavigationLinks

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
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <NavigationLinks /> {/* Add NavigationLinks */}
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
