import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { widgetApi } from '@/lib/api/client';

/**
 * Embeddable tip widget page – designed to be embedded in an iframe.
 * URL: /widget/:username
 * OBS/browser source compatible.
 */
export default function WidgetEmbedPage() {
  const { username } = useParams<{ username: string }>();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    widgetApi.getConfig(username)
      .then(setConfig)
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-gray-400">
        Creator not found
      </div>
    );
  }

  const { creator, config: cfg, stats } = config;
  const presets = cfg?.presetAmounts?.length > 0
    ? cfg.presetAmounts.map((a: number) => a / 1e9)
    : [0.1, 0.5, 1, 5];

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-purple-500/30 bg-[#12122a]/95 backdrop-blur-xl p-6 shadow-2xl shadow-purple-500/10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          {creator.imageUrl ? (
            <img src={creator.imageUrl} alt="" className="w-12 h-12 rounded-full border-2 border-purple-500/50" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center text-white font-bold text-lg">
              {creator.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-1">
              {creator.displayName || creator.username}
              {creator.isVerified && <span className="text-blue-400 text-sm" title="Verified">&#10003;</span>}
            </h2>
            <p className="text-gray-400 text-sm">@{creator.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white font-bold">{stats.totalTips || 0}</p>
            <p className="text-gray-500 text-xs">Tips</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white font-bold">{(Number(stats.totalAmountLamports || 0) / 1e9).toFixed(1)}</p>
            <p className="text-gray-500 text-xs">SOL</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <p className="text-white font-bold">{stats.totalUniqueTippers || 0}</p>
            <p className="text-gray-500 text-xs">Supporters</p>
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presets.map((amount: number) => (
            <button
              key={amount}
              onClick={() => window.open(`${window.location.origin}/${creator.username}?tip=${amount}`, '_blank')}
              className="py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/40 transition text-sm font-medium"
            >
              {amount} SOL
            </button>
          ))}
        </div>

        {/* USD Price */}
        {cfg.solPriceUsd > 0 && (
          <p className="text-center text-gray-500 text-xs mb-4">
            1 SOL = ${cfg.solPriceUsd.toFixed(2)} USD
          </p>
        )}

        {/* CTA */}
        <a
          href={`${window.location.origin}/${creator.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-green-400 text-white font-bold text-center hover:opacity-90 transition"
        >
          Send Tip
        </a>

        <p className="text-center text-gray-600 text-xs mt-3">
          Powered by SolTip
        </p>
      </div>
    </div>
  );
}
