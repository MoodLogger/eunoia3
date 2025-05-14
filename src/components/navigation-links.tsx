
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, UserPlus, UserCircle } from 'lucide-react';

export function NavigationLinks() {
  const { currentUser, logout, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <nav className="flex items-center gap-2 p-4 absolute top-0 right-0 z-50">
      {currentUser ? (
        <>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            <UserCircle className="inline-block mr-1 h-4 w-4" /> {currentUser.email}
          </span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-1 h-4 w-4" /> Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">
              <LogIn className="mr-1 h-4 w-4" /> Login
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/register">
              <UserPlus className="mr-1 h-4 w-4" /> Register
            </Link>
          </Button>
        </>
      )}
    </nav>
  );
}
