import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Navigate } from 'react-router-dom';
import { usePlatformConfig, usePausePlatform, useVerifyCreator } from '@/api/admin';
import { Button, Input, Card, Switch, Badge, Skeleton } from '@/components/ui';

// Helper to safely get string from a value that might be a PublicKey or string
const toStr = (v: any): string => (typeof v === 'string' ? v : v?.toBase58?.() ?? String(v ?? ''));

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const { data: config, isLoading } = usePlatformConfig();
  const pausePlatform = usePausePlatform();
  const verifyCreator = useVerifyCreator();

  const [creatorAddr, setCreatorAddr] = useState('');
  const [verifyValue, setVerifyValue] = useState(true);

  if (!connected) return <Navigate to="/" replace />;

  // Platform config comes as flat { authority, treasury, paused, ... } from REST API
  const cfg = config?.account ?? config;
  const isAdmin = cfg && toStr(cfg.authority) === publicKey?.toBase58();

  if (isLoading) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-8">
        <Skeleton className="h-20 rounded-xl mb-6" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold mb-2">Access Denied</h2>
        <p className="text-white/45">Only the platform authority can access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-extrabold mb-8">Platform Admin</h1>

      {/* Platform Status */}
      <Card className="!p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Platform Status</h2>
          <Badge variant={cfg?.paused ? 'danger' : 'success'}>
            {cfg?.paused ? 'Paused' : 'Live'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/45 text-sm">Pause all tipping activity</span>
          <div className="flex items-center gap-3">
            <Switch
              checked={cfg?.paused ?? false}
              onCheckedChange={(checked: boolean) => pausePlatform.mutateAsync(checked)}
            />
            {pausePlatform.isPending && <span className="text-xs text-white/40">Updating...</span>}
          </div>
        </div>
      </Card>

      {/* Verify Creator */}
      <Card className="!p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Verify Creator</h2>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Creator wallet address"
            value={creatorAddr}
            onChange={(e) => setCreatorAddr(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              fullWidth
              onClick={() => verifyCreator.mutateAsync({ creatorAddress: creatorAddr, verified: true })}
              disabled={!creatorAddr || verifyCreator.isPending}
              loading={verifyCreator.isPending && verifyValue}
            >
              Verify
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={() => {
                setVerifyValue(false);
                verifyCreator.mutateAsync({ creatorAddress: creatorAddr, verified: false });
              }}
              disabled={!creatorAddr || verifyCreator.isPending}
              loading={verifyCreator.isPending && !verifyValue}
            >
              Unverify
            </Button>
          </div>
        </div>
      </Card>

      {/* Platform Config Info */}
      <Card className="!p-6">
        <h2 className="font-bold text-lg mb-4">Configuration</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/45">Authority</span>
            <span className="font-mono text-xs">{toStr(cfg?.authority).slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/45">Platform Fee</span>
            <span>{cfg?.platformFeeBps ?? 100} bps ({((cfg?.platformFeeBps ?? 100) / 100).toFixed(0)}%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
