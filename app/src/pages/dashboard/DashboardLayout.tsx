import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';

export default function DashboardLayout() {
  const { connected } = useWallet();
  if (!connected) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-6 lg:px-10 max-w-[960px]">
        <Outlet />
      </main>
    </div>
  );
}
