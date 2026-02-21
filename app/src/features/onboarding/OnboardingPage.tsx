import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { useCreateProfile } from '@/api/profile';
import { useInitializeVault } from '@/api/vault';
import { useMyProfile } from '@/api/profile';
import { Button, Input, Textarea, Card } from '@/components/ui';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton/WalletConnectButton';
import { LIMITS } from '@/lib/solana/constants';

export default function OnboardingPage() {
  const { connected } = useWallet();
  const navigate = useNavigate();
  const { data: existingProfile } = useMyProfile();
  const createProfile = useCreateProfile();
  const initVault = useInitializeVault();

  const [step, setStep] = useState<'connect' | 'profile' | 'vault' | 'done'>(!connected ? 'connect' : existingProfile ? 'vault' : 'profile');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  React.useEffect(() => {
    if (connected && step === 'connect') setStep(existingProfile ? 'vault' : 'profile');
  }, [connected, existingProfile, step]);

  const handleCreateProfile = async () => {
    await createProfile.mutateAsync({
      username,
      displayName,
      description,
      imageUrl,
      withdrawalFeeBps: 200,
      acceptAnonymous: true,
    });
    setStep('vault');
  };

  const handleInitVault = async () => {
    await initVault.mutateAsync();
    setStep('done');
  };

  const steps = [
    { key: 'connect', label: '1. Connect Wallet' },
    { key: 'profile', label: '2. Create Profile' },
    { key: 'vault', label: '3. Initialize Vault' },
    { key: 'done', label: '4. Ready!' },
  ];

  return (
    <div className="max-w-[520px] mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">Get Started on SolTip</h1>
      <p className="text-[#86868b] text-center mb-10">Set up your creator profile in 3 easy steps</p>

      {/* Progress */}
      <div className="flex justify-between mb-10">
        {steps.map((s) => (
          <div key={s.key} className="flex-1 text-center">
            <div
              className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${
                s.key === step
                  ? 'bg-solana-purple text-white'
                  : steps.indexOf(s) < steps.findIndex(x => x.key === step)
                    ? 'bg-solana-green/20 text-solana-green'
                    : 'bg-[#f5f5f7] text-[#aeaeb2]'
              }`}
            >
              {steps.indexOf(s) < steps.findIndex(x => x.key === step) ? '\u2713' : steps.indexOf(s) + 1}
            </div>
            <span className="text-xs text-[#86868b]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step: Connect */}
      {step === 'connect' && (
        <Card className="!p-8 text-center">
          <h2 className="font-bold text-lg mb-4">Connect Your Wallet</h2>
          <p className="text-[#86868b] text-sm mb-6">Connect your Solana wallet to get started.</p>
          <WalletConnectButton />
        </Card>
      )}

      {/* Step: Profile */}
      {step === 'profile' && (
        <Card className="!p-8">
          <h2 className="font-bold text-lg mb-5">Create Your Profile</h2>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Username (e.g. coolgamer)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={LIMITS.MAX_USERNAME_LENGTH}
            />
            <Input
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={LIMITS.MAX_DISPLAY_NAME_LENGTH}
            />
            <Textarea
              placeholder="Bio / description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={LIMITS.MAX_DESCRIPTION_LENGTH}
              rows={3}
            />
            <Input
              placeholder="Profile image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              maxLength={LIMITS.MAX_IMAGE_URL_LENGTH}
            />
            <Button
              fullWidth
              onClick={handleCreateProfile}
              disabled={!username || !displayName || createProfile.isPending}
              loading={createProfile.isPending}
            >
              Create Profile
            </Button>
          </div>
        </Card>
      )}

      {/* Step: Vault */}
      {step === 'vault' && (
        <Card className="!p-8 text-center">
          <h2 className="font-bold text-lg mb-4">Initialize Your Vault</h2>
          <p className="text-[#86868b] text-sm mb-6">
            Your vault is a secure on-chain account where tips accumulate before you withdraw them.
          </p>
          <Button
            fullWidth
            onClick={handleInitVault}
            disabled={initVault.isPending}
            loading={initVault.isPending}
          >
            Initialize Vault
          </Button>
        </Card>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <Card className="!p-8 text-center">
          <div className="text-5xl mb-4">{'\uD83C\uDF89'}</div>
          <h2 className="font-bold text-xl mb-3">You're all set!</h2>
          <p className="text-[#86868b] text-sm mb-6">Your SolTip profile is ready. Share your link to start receiving tips.</p>
          <Button fullWidth onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}
