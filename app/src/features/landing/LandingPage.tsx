import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';

const stats = [
  { label: 'Creators', value: '10,000+' },
  { label: 'Tips Sent', value: '500K+' },
  { label: 'Total Volume', value: '$2M+' },
  { label: 'Countries', value: '80+' },
];

const features = [
  { icon: '\u26A1', title: 'Instant SOL Tips', desc: 'Send tips in milliseconds with near-zero fees on Solana.' },
  { icon: '\uD83E\uDE99', title: 'Multi-Token Support', desc: 'Accept USDC, USDT, or any SPL token alongside native SOL.' },
  { icon: '\uD83C\uDFAF', title: 'Fundraising Goals', desc: 'Set targets, track progress, and motivate your community.' },
  { icon: '\uD83D\uDD04', title: 'Recurring Subscriptions', desc: 'Build predictable monthly income from loyal supporters.' },
  { icon: '\u2702\uFE0F', title: 'Tip Splits', desc: 'Automatically share revenue with collaborators on-chain.' },
  { icon: '\uD83D\uDD12', title: 'Non-Custodial', desc: 'Your keys, your funds. No middlemen, no freezes.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative flex flex-col items-center text-center pt-32 pb-24 px-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-[720px]"
        >
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full border border-solana-purple/30 text-sm text-solana-purple">
            Built on Solana
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-5">
            The Future of{' '}
            <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              Creator Monetization
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-[540px] mx-auto mb-10 leading-relaxed">
            SolTip lets fans support creators directly on-chain — instantly, cheaply, and without middlemen. Set up your profile in 60 seconds.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/onboarding">
              <Button size="lg" className="shadow-[0_0_32px_rgba(153,69,255,0.4)]">
                Start Earning Free
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="secondary" size="lg">Explore Creators</Button>
            </Link>
          </div>
        </motion.div>
        {/* Glow orbs */}
        <div className="absolute -top-[200px] -right-[100px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(153,69,255,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[100px] -left-[50px] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(20,241,149,0.1)_0%,transparent_70%)] pointer-events-none" />
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-surface-card/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[900px] mx-auto">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center p-8 bg-surface-card border border-surface-border rounded-2xl"
            >
              <div className="text-3xl font-extrabold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-sm text-white/40 mt-2">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="text-4xl font-extrabold mb-4">Everything You Need</h2>
        <p className="text-white/45 text-lg mb-12">A complete creator economy platform running entirely on-chain.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="p-7 bg-surface-card border border-surface-border rounded-2xl hover:border-solana-purple transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-surface-card/30">
        <h2 className="text-4xl font-extrabold mb-4">Ready to Get Tipped?</h2>
        <p className="text-white/45 text-lg mb-8">Join thousands of creators already earning on SolTip.</p>
        <Link to="/onboarding">
          <Button size="lg" className="shadow-[0_0_32px_rgba(153,69,255,0.4)]">
            Create Your Profile
          </Button>
        </Link>
      </section>
    </div>
  );
}
