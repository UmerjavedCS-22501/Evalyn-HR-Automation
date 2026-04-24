"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import styles from "./success.module.css";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const accessToken = searchParams.get("access_token");
  const personUrn = searchParams.get("person_urn");
  const name = searchParams.get("name") || "LinkedIn User";
  const email = searchParams.get("email") || "Email not shared";
  const picture = searchParams.get("picture") || "https://via.placeholder.com/60";
  const pendingText = searchParams.get("pending_text") || "";

  const [accEmail, setAccEmail] = useState("");
  const [accPassword, setAccPassword] = useState("");
  const [text, setText] = useState(pendingText);
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ status: string; message: string; data: any } | null>(null);

  useEffect(() => {
    // Save to local storage for future one-click publishing
    if (accessToken && personUrn) {
      localStorage.setItem("li_access_token", accessToken);
      localStorage.setItem("li_person_urn", personUrn);
    }
  }, [accessToken, personUrn]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    const formData = new FormData();
    formData.append("access_token", accessToken || "");
    formData.append("person_urn", personUrn || "");
    formData.append("text", text);
    formData.append("acc_email", accEmail);
    formData.append("acc_password", accPassword);

    try {
      const response = await fetch("http://localhost:8000/auth/linkedin/post", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setPostResult(data);
    } catch (err: any) {
      alert("Posting failed: " + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  if (postResult) {
    return (
      <div className={styles.card}>
        <div className={styles.successIcon}>
          {postResult.status === "success" ? "🎉" : "❌"}
        </div>
        <h2 style={{ color: postResult.status === "success" ? "#1e1b4b" : "#ef4444", marginBottom: "1rem", textAlign: "center" }}>
          {postResult.message}
        </h2>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "2rem" }}>
          {postResult.status === "success" 
            ? "Your AI-generated job post is now live on LinkedIn." 
            : "Something went wrong. Please check your credentials and try again."}
        </p>
        <button className="premium-btn" onClick={() => router.push("/dashboard/generated")} style={{ width: "100%", padding: "1rem" }}>
          Back to Jobs Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <div className={styles.badge}>Connection Secure</div>
        <h1>Successfully Linked!</h1>
        <p>Your LinkedIn account is connected and ready to publish.</p>
      </header>

      <div className={styles.profileCard}>
        <div className={styles.profileGlow}></div>
        <img src={picture} alt="Profile" className={styles.profilePic} />
        <div className={styles.profileInfo}>
          <h3>{name}</h3>
          <span>{email}</span>
        </div>
      </div>

      <form onSubmit={handlePost} className={styles.form}>
        <div className={styles.verificationSection}>
          <div className={styles.sectionHeader}>
             <h4>Account Verification</h4>
             <span className={styles.secureBadge}>🔒 Secure Session</span>
          </div>
          <div className={styles.inputGrid}>
            <div className={styles.inputWrap}>
              <label>LinkedIn Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                required
                value={accEmail}
                onChange={(e) => setAccEmail(e.target.value)}
              />
            </div>
            <div className={styles.inputWrap}>
              <label>LinkedIn Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={accPassword}
                onChange={(e) => setAccPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.postSection}>
          <label>Post Preview</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Review your post content..."
          />
        </div>

        <button type="submit" className="premium-btn" disabled={isPosting} style={{ width: "100%", padding: "1.25rem" }}>
          {isPosting ? "Publishing to LinkedIn..." : "Publish Post Now"}
        </button>
        
        <p className={styles.disclaimer}>
          By clicking publish, you agree to post this content to your LinkedIn profile. Credentials are used for session verification only.
        </p>
      </form>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlow}></div>
      <Suspense fallback={<div style={{ color: "#1e1b4b", fontWeight: "700" }}>Securing your session...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
