"use client";

import React, { useState, useEffect, use } from "react";

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  description: string;
  approval_status?: string;
}

export default function ReviewJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalStatus, setFinalStatus] = useState("");

  useEffect(() => {
    if (!jobId) return;
    fetch(`http://localhost:8000/job/${jobId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
      })
      .then((data) => setJob(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (status: "Approved" | "Changes Requested") => {
    if (status === "Changes Requested" && !feedback.trim()) {
      alert("Please provide your feedback before requesting changes.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/job/${jobId}/submit-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, feedback: feedback.trim() || null }),
      });
      if (res.ok) {
        setFinalStatus(status);
        setSubmitted(true);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch {
      alert("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "Segoe UI, sans-serif" }}>
        <p style={{ color: "#64748b", fontSize: "1rem" }}>Loading job post...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "Segoe UI, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
          <h2 style={{ color: "#1e293b" }}>Job post not found.</h2>
          <p style={{ color: "#64748b" }}>This review link may be invalid or expired.</p>
          {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>Error: {error}</p>}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "Segoe UI, sans-serif" }}>
        <div style={{ textAlign: "center", background: "white", padding: "3rem 4rem", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", maxWidth: "500px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>
            {finalStatus === "Approved" ? "✅" : "📝"}
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.75rem" }}>
            {finalStatus === "Approved" ? "Post Approved!" : "Changes Requested!"}
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6" }}>
            {finalStatus === "Approved"
              ? "You have approved this job post. The recruiting team has been notified and the post is ready to be published."
              : "Your feedback has been sent to the recruiting team. They will make the necessary changes and may send an updated version for review."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Segoe UI, sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "750px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "white", padding: "0.5rem 1.25rem", borderRadius: "99px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>✨</span>
            <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1e293b" }}>Evalyn</span>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>• Recruitment Review Portal</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", marginBottom: "0.5rem" }}>
            Operation Manager Review
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Please review the job post below. You can approve it or suggest changes.
          </p>
        </div>

        {/* Job Card */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2rem", marginBottom: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>{job.title}</h2>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#64748b" }}>
              {job.location && <span>📍 {job.location}</span>}
              {job.department && <span>🏢 {job.department}</span>}
            </div>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", fontSize: "0.9rem", lineHeight: "1.8", color: "#334155", whiteSpace: "pre-wrap" }}>
            {job.description}
          </div>
        </div>

        {/* Review Form */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>Your Feedback</h3>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
            Optional if approving. Required if requesting changes.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Please clarify the salary range. The responsibilities section needs more detail..."
            style={{
              width: "100%",
              height: "150px",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "0.875rem",
              lineHeight: "1.6",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              marginBottom: "1.5rem",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => handleSubmit("Changes Requested")}
              disabled={submitting}
              style={{ flex: 1, padding: "0.875rem", borderRadius: "12px", border: "2px solid #f97316", background: "white", color: "#f97316", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}
            >
              {submitting ? "Submitting..." : "✏️ Request Changes"}
            </button>
            <button
              onClick={() => handleSubmit("Approved")}
              disabled={submitting}
              style={{ flex: 1, padding: "0.875rem", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "white", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
            >
              {submitting ? "Submitting..." : "✅ Approve Post"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.75rem", color: "#94a3b8" }}>
          Powered by Evalyn AI Recruitment System
        </p>
      </div>
    </div>
  );
}
