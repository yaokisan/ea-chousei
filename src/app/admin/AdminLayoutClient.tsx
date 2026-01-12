'use client';

import Header from '@/components/admin/Header';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  signOutAction: () => Promise<void>;
}

export default function AdminLayoutClient({
  children,
  user,
  signOutAction,
}: AdminLayoutClientProps) {
  const handleSignOut = async () => {
    await signOutAction();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} onSignOut={handleSignOut} />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
