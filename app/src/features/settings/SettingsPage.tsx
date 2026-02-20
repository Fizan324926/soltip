import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { profileApi } from '@/lib/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useMyProfile } from '@/api/profile';

/**
 * Extended profile settings: preset amounts, social links, webhook URL.
 */
export default function SettingsPage() {
  const { publicKey } = useWallet();
  const publicKeyString = publicKey?.toBase58() || null;
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();

  const [presets, setPresets] = useState<string[]>(['']);
  const [socialLinks, setSocialLinks] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      const acct = (profile as any).account ?? profile;
      const existing = acct.presetAmounts || [];
      setPresets(existing.length > 0 ? existing.map((a: number) => String(a / 1e9)) : ['']);
      setSocialLinks(acct.socialLinks || '');
      setWebhookUrl(acct.webhookUrl || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const preset_amounts = presets
        .filter(p => p && parseFloat(p) > 0)
        .map(p => Math.floor(parseFloat(p) * 1e9));
      return profileApi.updateProfile(publicKeyString!, {
        preset_amounts,
        social_links: socialLinks,
        webhook_url: webhookUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!publicKeyString) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Connect wallet to manage settings</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Profile Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Configure extended profile options</p>
      </div>

      {/* Preset Tip Amounts */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Preset Tip Amounts</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">Quick tip buttons shown on your profile (max 5)</p>
        <div className="space-y-2">
          {presets.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={p}
                onChange={(e) => {
                  const next = [...presets];
                  next[i] = e.target.value;
                  setPresets(next);
                }}
                placeholder="Amount in SOL"
                type="number"
                step="0.01"
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">SOL</span>
              {presets.length > 1 && (
                <button
                  onClick={() => setPresets(presets.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {presets.length < 5 && (
            <button
              onClick={() => setPresets([...presets, ''])}
              className="text-sm text-[var(--color-brand-purple)] hover:underline"
            >
              + Add preset
            </button>
          )}
        </div>
      </div>

      {/* Social Links */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Social Links</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Format: platform:handle (e.g., "twitch:mystream, twitter:myhandle")
        </p>
        <textarea
          value={socialLinks}
          onChange={(e) => setSocialLinks(e.target.value)}
          placeholder="twitch:mystream, twitter:myhandle, youtube:mychannel"
          rows={3}
          maxLength={256}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)] resize-none"
        />
      </div>

      {/* Webhook URL */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Webhook URL</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Receive real-time tip notifications at this URL
        </p>
        <input
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-server.com/webhooks/soltip"
          maxLength={200}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-base)] px-4 py-2 text-[var(--color-text-primary)]"
        />
      </div>

      {/* Embed Widget Info */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Embed Widget</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Add a tip button to your website with one line of HTML:
        </p>
        <code className="block p-3 rounded-lg bg-[var(--color-surface-base)] text-sm text-[var(--color-brand-green)] font-mono break-all">
          {`<iframe src="${window.location.origin}/widget/${((profile as any)?.account ?? profile as any)?.username || 'username'}" width="400" height="500" frameborder="0"></iframe>`}
        </code>

        <h4 className="text-md font-semibold text-[var(--color-text-primary)] mt-4">OBS Alert Overlay</h4>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Add as a Browser Source in OBS:
        </p>
        <code className="block p-3 rounded-lg bg-[var(--color-surface-base)] text-sm text-[var(--color-brand-green)] font-mono break-all">
          {`${window.location.origin}/overlay/${((profile as any)?.account ?? profile as any)?.username || 'username'}`}
        </code>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--color-brand-purple)] to-[var(--color-brand-green)] text-white font-bold hover:opacity-90 transition disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="text-[var(--color-brand-green)] text-sm font-medium">Saved!</span>}
      </div>
    </div>
  );
}
