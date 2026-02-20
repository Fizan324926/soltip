import React from "react";
import { motion } from "framer-motion";
import styles from "./LandingStats.module.css";

const STATS = [
  { value: "10K+", label: "Active Creators" },
  { value: "500K+", label: "Tips Sent" },
  { value: "$2M+", label: "Total Volume" },
  { value: "< 0.01¢", label: "Avg Fee" },
];

export default function LandingStats() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={styles.value}>{s.value}</div>
            <div className={styles.label}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
