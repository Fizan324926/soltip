import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar/Navbar';
import { Footer } from './Footer/Footer';
import { usePlatformStore } from '@/stores/platformStore';
import type { Network } from '@/types';

// ============================================================
// RootLayout
//
// Wraps all public-facing pages with Navbar + Footer.
// Fetches PlatformConfig on mount and keeps the store updated.
// ============================================================

export const RootLayout: React.FC = () => {
  const { setConfig, setPaused } = usePlatformStore();
  const network = (import.meta.env['VITE_NETWORK'] as Network) ?? 'devnet';

  useEffect(() => {
    // Lazy import to avoid circular deps at module load time.
    // The platform config is fetched using the program instance from the
    // AnchorProvider that wraps this component in the app tree.
    // We do a best-effort fetch here; actual data fetching should use
    // React Query hooks in individual components.
    const fetchConfig = async () => {
      try {
        // Dynamically import to avoid pulling in the full anchor Program
        // at layout mount time (providers may not be ready synchronously).
        const { fetchPlatformConfig } = await import('@/lib/anchor/queries/fetchPlatformConfig');
        const { getProgram } = await import('@/lib/anchor/program');

        const program = getProgram();
        if (!program) return;

        const config = await fetchPlatformConfig(program);
        if (config) {
          setConfig(config);
          setPaused(config.paused);
        }
      } catch {
        // Silent fail — platform config fetch is non-critical for the layout.
        // Individual pages handle their own loading / error states.
      }
    };

    fetchConfig();
  }, [setConfig, setPaused]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1d1d1f] antialiased">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer network={network} />
    </div>
  );
};

export default RootLayout;
