"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login after successful registration
        router.push("/login?message=Account created! Please login.");
      } else {
        setError(data.detail || "Registration failed");
      }
    } catch (err: any) {
      setError("Connection failed. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>
      
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <div className={styles.logoIcon}>✨</div>
          Evalyn
        </div>
        <h1 className={styles.title}>Join the Revolution</h1>
        <p className={styles.subtitle}>Create your AI Recruitment Command Center</p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.inputWrap}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="e.g. recruit_pro"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputWrap}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputWrap}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="premium-btn"
            style={{ width: "100%", padding: "1.1rem 0", marginTop: "1rem" }}
            disabled={isLoading}
          >
            {isLoading ? "Creating Nexus..." : "Establish Account"}
          </button>
        </form>

        <p className={styles.footer}>
          Already part of Evalyn? <Link href="/login">Sign in here</Link>
        </p>
      </div>
    </main>
  );
}
