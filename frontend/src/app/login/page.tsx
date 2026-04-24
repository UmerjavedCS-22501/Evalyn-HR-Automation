"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../auth.module.css";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg) setMessage(msg);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to dashboard instead of landing page
        router.push("/dashboard/generated");
      } else {
        setError(data.detail || "Login failed");
      }
    } catch (err: any) {
      setError("Connection failed. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authLogo}>
        <div className={styles.logoIcon}>✨</div>
        Evalyn
      </div>
      <h1 className={styles.title}>Welcome Back</h1>
      <p className={styles.subtitle}>Sign in to your recruitment command center</p>

      {message && <div style={{ color: "#10b981", marginBottom: "1.5rem", fontSize: "0.9rem", textAlign: "center", fontWeight: "600" }}>{message}</div>}
      {error && <div className={styles.errorBanner}>{error}</div>}

      <form onSubmit={handleLogin} className={styles.form}>
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
          {isLoading ? "Authenticating..." : "Access Dashboard"}
        </button>
      </form>

      <p className={styles.footer}>
        New to Evalyn? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>
      <Suspense fallback={<div style={{ color: "white", fontWeight: "700" }}>Preparing Secure Login...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
