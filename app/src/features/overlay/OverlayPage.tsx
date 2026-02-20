import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { widgetApi } from '@/lib/api/client';

/**
 * OBS Alert Overlay – designed as a browser source for streaming software.
 * URL: /overlay/:username
 * Auto-refreshes every 5 seconds to show new tips.
 * Transparent background for compositing.
 */
export default function OverlayPage() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<any>(null);
  const [latestTip, setLatestTip] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);

  const fetchData = useCallback(async () => {
    if (!username) return;
    try {
      const result = await widgetApi.getOverlay(username);
      setData(result);

      // Check for new tips
      if (result.recentTips?.length > 0) {
        const newest = result.recentTips[0];
        const tipTs = newest.createdAt || 0;
        if (tipTs > lastSeen) {
          setLatestTip(newest);
          setShowAlert(true);
          setLastSeen(tipTs);
          // Auto-hide after 8 seconds
          setTimeout(() => setShowAlert(false), 8000);
        }
      }
    } catch {
      // Silently retry
    }
  }, [username, lastSeen]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden font-sans">
      {/* Tip Alert */}
      {showAlert && latestTip && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.5s_ease-out]">
          <div className="rounded-2xl border-2 border-purple-500/50 bg-[#12122a]/95 backdrop-blur-xl px-8 py-6 shadow-2xl shadow-purple-500/30 min-w-[320px] text-center">
            <div className="text-4xl mb-2">
              {Number(latestTip.amountLamports || 0) >= 1e9 ? '🎉' : '💜'}
            </div>
            <p className="text-lg text-gray-400 mb-1">
              <span className="text-white font-bold">
                {latestTip.tipper === 'Anonymous' ? 'Anonymous' : `${latestTip.tipper.slice(0, 4)}...${latestTip.tipper.slice(-4)}`}
              </span>
              {' '}tipped
            </p>
            <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
              {(Number(latestTip.amountLamports || 0) / 1e9).toFixed(2)} SOL
            </p>
            {latestTip.amountUsd > 0 && (
              <p className="text-sm text-gray-500">(${latestTip.amountUsd.toFixed(2)} USD)</p>
            )}
            {latestTip.message && (
              <p className="mt-2 text-white/80 text-sm italic">"{latestTip.message}"</p>
            )}
          </div>
        </div>
      )}

      {/* Goal Progress Bar (bottom) */}
      {data?.activeGoals?.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          {data.activeGoals.slice(0, 1).map((goal: any, i: number) => (
            <div key={i} className="rounded-xl bg-[#12122a]/80 backdrop-blur border border-purple-500/20 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm">{goal.title}</span>
                <span className="text-gray-400 text-xs">{goal.progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-green-400 transition-all duration-1000"
                  style={{ width: `${Math.min(goal.progressPct || 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Poll (top-right) */}
      {data?.activePolls?.length > 0 && !showAlert && (
        <div className="fixed top-4 right-4 z-30">
          {data.activePolls.slice(0, 1).map((poll: any, i: number) => (
            <div key={i} className="rounded-xl bg-[#12122a]/80 backdrop-blur border border-purple-500/20 px-4 py-3 w-64">
              <p className="text-white font-medium text-sm mb-2">{poll.title}</p>
              {(Array.isArray(poll.options) ? poll.options : []).map((opt: any, j: number) => {
                const total = poll.totalVotes || 1;
                const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
                return (
                  <div key={j} className="mb-1">
                    <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                      <span>{opt.label}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -100%); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
