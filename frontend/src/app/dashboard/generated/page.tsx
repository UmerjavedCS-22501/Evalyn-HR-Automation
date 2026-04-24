"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  description: string;
}

export default function GeneratedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState<number | null>(null);
  
  // Verification Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:8000/jobs/all"); 
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleDelete = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job and all its applications?")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/job/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== jobId));
      } else {
        alert("Failed to delete job.");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const handlePublishToLinkedIn = async () => {
    if (activeJobId === null) return;
    
    // Check if LinkedIn credentials exist in localStorage
    const li_token = localStorage.getItem("li_access_token");
    const li_urn = localStorage.getItem("li_person_urn");

    if (!li_token || !li_urn) {
      if (confirm("You need to connect your LinkedIn account first. Connect now?")) {
        window.location.href = "http://localhost:8000/auth/linkedin";
      }
      return;
    }

    if (!verifyEmail || !verifyPassword) {
      alert("Please provide your LinkedIn credentials for session verification.");
      return;
    }

    setIsPublishing(activeJobId);
    setShowModal(false);
    
    try {
      const formData = new FormData();
      formData.append("job_id", activeJobId.toString());
      formData.append("access_token", li_token);
      formData.append("person_urn", li_urn);
      formData.append("acc_email", verifyEmail);
      formData.append("acc_password", verifyPassword);

      const res = await fetch("http://localhost:8000/post-job", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        alert("🎉 Job published to LinkedIn successfully!");
        setVerifyEmail("");
        setVerifyPassword("");
      } else {
        const errorMsg = data.message || (data.detail ? JSON.stringify(data.detail) : "Unknown error");
        alert("❌ Failed to publish: " + errorMsg);
      }
    } catch (err) {
      alert("❌ Connection error.");
    } finally {
      setIsPublishing(null);
      setActiveJobId(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Generated Jobs</h1>
        <Link href="/dashboard/jobs/new" className="premium-btn" style={{ padding: "0.6rem 1.5rem", fontSize: "0.875rem" }}>
          + New Job
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div style={{ background: "white", padding: "4rem", borderRadius: "16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✨</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No jobs generated yet</h3>
          <p style={{ color: "#64748b" }}>Start by creating a new job and let AI architect your post.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.25rem" }}>{job.title}</h3>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#64748b" }}>
                    <span>📍 {job.location || "Remote"}</span>
                    <span>🏢 {job.department || "Engineering"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                   <Link href={`/jobs/${job.id}/apply`} target="_blank" style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid #e2e8f0", textDecoration: "none", color: "#1e293b" }}>
                    View Form
                  </Link>
                  <button 
                    onClick={() => {
                        setActiveJobId(job.id);
                        setShowModal(true);
                    }}
                    disabled={isPublishing === job.id}
                    style={{ 
                      fontSize: "0.75rem", 
                      padding: "0.4rem 0.8rem", 
                      borderRadius: "6px", 
                      background: "#0077b5", 
                      color: "white", 
                      border: "none", 
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    {isPublishing === job.id ? "Publishing..." : "Publish LinkedIn"}
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(job.description);
                    alert("Post copied to clipboard!");
                  }} style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", background: "#f1f5f9", border: "none", cursor: "pointer", color: "#1e293b" }}>
                    Copy Post
                  </button>
                  <button 
                    onClick={() => handleDelete(job.id)}
                    style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "6px", background: "#fee2e2", color: "#ef4444", border: "none", cursor: "pointer" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", fontSize: "0.8125rem", color: "#334155", whiteSpace: "pre-wrap", maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0" }}>
                {job.description}
              </div>
              <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                 Application URL: http://localhost:3000/jobs/{job.id}/apply
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showModal && (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
        }}>
            <div style={{
                background: "white",
                padding: "2.5rem",
                borderRadius: "24px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
            }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔐</div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Account Verification</h2>
                    <p style={{ fontSize: "0.875rem", color: "#64748b" }}>Please verify your LinkedIn session to publish this post.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "0.5rem" }}>LinkedIn Email</label>
                        <input 
                            type="email"
                            placeholder="email@example.com"
                            value={verifyEmail}
                            onChange={(e) => setVerifyEmail(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.875rem" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#475569", marginBottom: "0.5rem" }}>LinkedIn Password</label>
                        <input 
                            type="password"
                            placeholder="••••••••"
                            value={verifyPassword}
                            onChange={(e) => setVerifyPassword(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.875rem" }}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button 
                        onClick={() => {
                            setShowModal(false);
                            setActiveJobId(null);
                        }}
                        style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", color: "#475569", cursor: "pointer", fontWeight: "600", fontSize: "0.875rem" }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handlePublishToLinkedIn}
                        style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "none", background: "#0077b5", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "0.875rem" }}
                    >
                        Confirm & Publish
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
