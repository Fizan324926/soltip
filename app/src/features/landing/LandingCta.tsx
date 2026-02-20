import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import styles from "./LandingCta.module.css";

export default function LandingCta() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Ready to Start Getting Tipped?</h2>
      <p className={styles.desc}>Create your profile in 60 seconds. No KYC, no bank account, no waiting.</p>
      <Link to="/onboarding">
        <Button size="lg" className={styles.btn}>Create Your Free Profile →</Button>
      </Link>
    </section>
  );
}
