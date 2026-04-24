"use client";

import React from "react";
import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={styles.wrapper}>
      {/* Dynamic Background */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>
      <div className={styles.gridOverlay}></div>

      {/* Floating Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>✨</div>
          Evalyn
        </div>
        <div className={styles.navLinks}>
           <Link href="/login">Platform Login</Link>
           <Link href="/register" className={styles.ctaBtn}>Start Hiring</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>🚀 AI-Powered Talent Acquisition</div>
          <h1 className={styles.mainTitle}>
            Architect Your <br />
            <span className={styles.gradientText}>Dream Team</span>
          </h1>
          <p className={styles.heroSub}>
            Evalyn uses advanced AI to generate world-class job descriptions, 
            publish directly to LinkedIn, and evaluate candidates with precision.
          </p>
          <div className={styles.heroActions}>
             <Link href="/register" className={styles.primaryBtn}>Generate Your First Job</Link>
             <button className={styles.secondaryBtn}>See Demo</button>
          </div>
        </div>

        {/* Unique Floating UI Element */}
        <div className={styles.visualArea}>
          <div className={styles.glassCard}>
             <div className={styles.cardHeader}>
               <div className={styles.dot}></div>
               <span>AI Generation in Progress...</span>
             </div>
             <div className={styles.typingContent}>
               <div className={styles.line}></div>
               <div className={styles.line} style={{ width: "80%" }}></div>
               <div className={styles.line} style={{ width: "60%" }}></div>
             </div>
             <div className={styles.statusPill}>98% Match Potential</div>
          </div>
          
          <div className={styles.miniCard1}>
             <div className={styles.miniIcon}>👥</div>
             <div>
               <div className={styles.miniTitle}>New Applicant</div>
               <div className={styles.miniSub}>John Doe • Senior Dev</div>
             </div>
          </div>

          <div className={styles.miniCard2}>
             <div className={styles.miniIcon}>📊</div>
             <div>
               <div className={styles.miniTitle}>ATS Score</div>
               <div className={styles.miniSub}>89% - Recommended</div>
             </div>
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className={styles.features}>
         <div className={styles.featureItem}>
            <div className={styles.fIcon}>✨</div>
            <h3>AI Architect</h3>
            <p>Generate professional, SEO-optimized job posts in seconds.</p>
         </div>
         <div className={styles.featureItem}>
            <div className={styles.fIcon}>🔗</div>
            <h3>One-Click Publish</h3>
            <p>Distribute your jobs directly to LinkedIn with active apply links.</p>
         </div>
         <div className={styles.featureItem}>
            <div className={styles.fIcon}>🎯</div>
            <h3>Smart Evaluation</h3>
            <p>Automated candidate screening and ATS scoring powered by AI.</p>
         </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Evalyn AI. Redefining Recruitment Excellence.</p>
      </footer>
    </div>
  );
}
