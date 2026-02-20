import React from "react";
import { motion } from "framer-motion";
import styles from "./LandingFeatures.module.css";

const FEATURES = [
  { icon: "⚡", title: "Instant SOL Tips", desc: "One-click tips confirmed in under 1 second on Solana." },
  { icon: "🪙", title: "Multi-Token (USDC/USDT)", desc: "Accept any SPL token alongside native SOL." },
  { icon: "🎯", title: "Fundraising Goals", desc: "Set targets with progress bars, rally your community." },
  { icon: "🔄", title: "Recurring Subscriptions", desc: "Monthly supporter subscriptions with auto-renewal." },
  { icon: "✂️", title: "Tip Splits", desc: "Distribute tips across your team automatically on-chain." },
  { icon: "🏆", title: "Donor Leaderboard", desc: "Recognize your top 10 supporters publicly." },
  { icon: "💬", title: "Message Attachments", desc: "Supporters can include a 280-char message with tips." },
  { icon: "🔒", title: "Non-Custodial Vault", desc: "Funds sit in your vault PDA. Withdraw anytime, no permission needed." },
  { icon: "👻", title: "Anonymous Tipping", desc: "Optional privacy mode for donors who want to stay hidden." },
];

export default function LandingFeatures() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 className={styles.title}>Everything You Need</h2>
          <p className={styles.desc}>A complete creator economy platform running 100% on-chain.</p>
        </div>
        <div className={styles.grid}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className={styles.icon}>{f.icon}</div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
