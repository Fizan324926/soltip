import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import styles from "./LandingHero.module.css";

export default function LandingHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        <div className={styles.badge}>⚡ Powered by Solana</div>
        <h1 className={styles.title}>
          Tip Creators{" "}
          <span className={styles.gradient}>Instantly On-Chain</span>
        </h1>
        <p className={styles.desc}>
          The fastest, cheapest way to support creators. Send SOL or USDC tips in seconds
          with near-zero fees — no middlemen, no freezes, fully non-custodial.
        </p>
        <div className={styles.ctas}>
          <Link to="/onboarding">
            <Button size="lg" className={styles.primaryBtn}>Start Earning Free →</Button>
          </Link>
          <Link to="/discover">
            <Button variant="outline" size="lg">Explore Creators</Button>
          </Link>
        </div>
        <div className={styles.social}>
          <span>Trusted by 10,000+ creators</span>
          <span>·</span>
          <span>$2M+ tipped on-chain</span>
        </div>
      </motion.div>
    </section>
  );
}
