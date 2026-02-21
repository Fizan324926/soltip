import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

/* ─── Data ──────────────────────────────────────────────────── */
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

const steps = [
  { num: '1', title: 'Connect', desc: 'Link your Solana wallet in one click. No sign-ups, no emails.' },
  { num: '2', title: 'Create', desc: 'Set up your creator profile with a custom tip page in 60 seconds.' },
  { num: '3', title: 'Earn', desc: 'Share your link and start receiving tips directly to your wallet.' },
];

/* ─── Animation Constants ───────────────────────────────────── */
const appleEase = [0.25, 0.46, 0.45, 0.94] as const;

const sectionVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: appleEase },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: appleEase },
  },
};

const counterItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: appleEase },
  },
};

/* ─── Reusable Section Wrapper ──────────────────────────────── */
function AnimatedSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={sectionVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Landing Page ──────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, 60]);

  return (
    <div className="landing-light min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-12 px-6">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-apple-heading hover:text-apple-heading"
          >
            <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
              Sol
            </span>
            Tip
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/discover"
              className="text-[13px] font-medium text-apple-body hover:text-apple-heading transition-colors"
            >
              Discover
            </Link>
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center h-8 px-4 text-[13px] font-medium rounded-full bg-apple-heading text-white hover:bg-[#424245] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <div ref={heroRef} className="relative">
        <motion.section
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative flex flex-col items-center text-center pt-40 pb-28 px-6 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: appleEase }}
            className="relative z-10 max-w-[800px]"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: appleEase, delay: 0.1 }}
              className="text-[15px] font-medium text-apple-body mb-5"
            >
              Built on Solana
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: appleEase, delay: 0.2 }}
              className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-tight text-apple-heading mb-6"
            >
              The Future of{' '}
              <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                Creator Monetization
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: appleEase, delay: 0.35 }}
              className="text-lg md:text-xl text-apple-body max-w-[540px] mx-auto mb-10 leading-relaxed"
            >
              SolTip lets fans support creators directly on-chain — instantly,
              cheaply, and without middlemen.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: appleEase, delay: 0.5 }}
              className="flex gap-5 justify-center items-center flex-wrap"
            >
              <Link
                to="/onboarding"
                className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-medium rounded-full bg-apple-heading text-white hover:bg-[#424245] transition-all duration-200 hover:scale-[1.02] hover:shadow-apple-card-hover"
              >
                Start Earning Free
              </Link>
              <Link
                to="/discover"
                className="text-[15px] font-medium text-solana-purple hover:text-solana-purple/80 transition-colors"
              >
                Explore Creators &rarr;
              </Link>
            </motion.div>
          </motion.div>

          {/* Subtle radial accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(153,69,255,0.04)_0%,transparent_70%)] pointer-events-none" />
        </motion.section>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <AnimatedSection className="py-20 px-6 bg-apple-offwhite">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[900px] mx-auto"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={counterItem} className="text-center">
              <div className="text-4xl md:text-5xl font-bold tracking-tight text-apple-heading">
                {s.value}
              </div>
              <div className="text-sm text-apple-caption mt-2 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* ── Features ───────────────────────────────────────── */}
      <AnimatedSection className="py-24 px-6 bg-white">
        <div className="max-w-[1100px] mx-auto text-center">
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight text-apple-heading mb-3 leading-tight">
            Everything You Need
          </h2>
          <p className="text-lg text-apple-body mb-16 max-w-[520px] mx-auto">
            A complete creator economy platform running entirely on-chain.
          </p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={staggerItem}
                className="p-7 bg-apple-offwhite rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-apple-card-hover hover:-translate-y-0.5"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold text-apple-heading mb-2">{f.title}</h3>
                <p className="text-sm text-apple-body leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ── How It Works ───────────────────────────────────── */}
      <AnimatedSection className="py-24 px-6 bg-apple-offwhite">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight text-apple-heading mb-3 leading-tight">
            How It Works
          </h2>
          <p className="text-lg text-apple-body mb-16 max-w-[460px] mx-auto">
            Three steps to start earning from your audience.
          </p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {steps.map((s) => (
              <motion.div key={s.num} variants={staggerItem} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-solana-purple to-solana-green flex items-center justify-center mb-5">
                  <span className="text-xl font-bold text-white">{s.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-apple-heading mb-2">{s.title}</h3>
                <p className="text-sm text-apple-body leading-relaxed max-w-[260px]">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ── CTA ────────────────────────────────────────────── */}
      <AnimatedSection className="py-28 px-6 text-center bg-white">
        <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight text-apple-heading mb-4 leading-tight">
          Ready to Get Tipped?
        </h2>
        <p className="text-lg text-apple-body mb-10 max-w-[440px] mx-auto">
          Join thousands of creators already earning on SolTip.
        </p>
        <Link
          to="/onboarding"
          className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-medium rounded-full bg-apple-heading text-white hover:bg-[#424245] transition-all duration-200 hover:scale-[1.02] hover:shadow-apple-card-hover"
        >
          Create Your Profile
        </Link>
      </AnimatedSection>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-apple-offwhite py-10 px-6 border-t border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-apple-caption">
            &copy; {new Date().getFullYear()} SolTip. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/discover"
              className="text-sm text-apple-body hover:text-apple-heading transition-colors"
            >
              Discover
            </Link>
            <Link
              to="/onboarding"
              className="text-sm text-apple-body hover:text-apple-heading transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
