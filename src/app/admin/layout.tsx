import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

  return (
    <AdminLayoutClient user={session.user} signOutAction={handleSignOut}>
      {children}
    </AdminLayoutClient>
  );
}
