"use client";

import React, { useState, useEffect, Suspense } from "react";
import { API_BASE_URL } from "@/config";
import styles from "./applications.module.css";

interface Applicant {
  id: number;
  full_name: string;
  email: string;
  skills: string;
  experience: string;
  ats_score: number | null;
  status: string;
  job_title: string;
  salary?: string | null;
  offer_status?: string | null;
  ats_details?: {
    ats_score: number;
    skill_match: string;
    experience_match: string;
    education_match: string;
    missing_skills: string[];
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  } | null;
}

export default function ApplicationsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("All Jobs");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  
  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [managerInput, setManagerInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/applications/all`)
      .then(res => res.json())
      .then(data => {
        // Flatten the job-grouped data for a unified production table
        const flattened = data.flatMap((job: any) => 
          job.applicants.map((app: any) => ({
            ...app,
            job_title: job.job_title
          }))
        );
        setApplicants(flattened);
      })
      .catch(err => console.error("Fetch error", err))
      .finally(() => setLoading(false));
  }, []);

  // Extract unique job titles and statuses for filters
  const uniqueJobs = Array.from(new Set(applicants.map(a => a.job_title)));
  const uniqueStatuses = ["Applied", "Evaluated", "In Process", "Selected", "Rejected"];

  const filtered = applicants.filter(a => {
    const matchesSearch = (a.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
                         (a.job_title?.toLowerCase() || "").includes(search.toLowerCase()) ||
                         (a.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
                         (a.skills?.toLowerCase() || "").includes(search.toLowerCase());
    
    const matchesJob = jobFilter === "All Jobs" || a.job_title === jobFilter;
    const matchesStatus = statusFilter === "All Statuses" || a.status === statusFilter;

    return matchesSearch && matchesJob && matchesStatus;
  });

  const handleDelete = async (appId: number) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/applications/${appId}`, { method: "DELETE" });
      if (res.ok) {
        setApplicants(applicants.filter(a => a.id !== appId));
      } else {
        alert("Failed to delete application.");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const handleStatusUpdate = async (appId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setApplicants(applicants.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        if (selectedApplicant?.id === appId) {
          setSelectedApplicant({ ...selectedApplicant, status: newStatus });
        }
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  const handleSendOffer = async () => {
    if (!selectedApplicant || !salaryInput) return;
    
    setSendingOffer(true);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/${selectedApplicant.id}/send-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          salary: salaryInput,
          start_date: startDateInput,
          reporting_manager: managerInput,
          acceptance_deadline: deadlineInput
        })
      });
      if (res.ok) {
        setApplicants(applicants.map(a => 
          a.id === selectedApplicant.id 
          ? { ...a, salary: salaryInput, offer_status: "Pending" } 
          : a
        ));
        setShowOfferModal(false);
        setSalaryInput("");
        setStartDateInput("");
        setManagerInput("");
        setDeadlineInput("");
        alert("Formal offer letter sent successfully!");
      } else {
        alert("Failed to send offer letter.");
      }
    } catch (err) {
      console.error("Send offer error", err);
    } finally {
      setSendingOffer(false);
    }
  };

  const openOfferModal = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setSalaryInput(applicant.salary || "");
    setStartDateInput("");
    setManagerInput("");
    setDeadlineInput("");
    setShowOfferModal(true);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    
    const headers = ["Name", "Email", "Job Title", "ATS Score", "Experience", "Status"];
    const rows = filtered.map(a => [
      a.full_name,
      a.email,
      a.job_title,
      `${a.ats_score}%`,
      a.experience,
      a.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDetail = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowDetailModal(true);
  };

  return (
    <div className={styles.container}>
      {/* Production Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Talent Pool</h1>
          <p className={styles.subtitle}>Manage and evaluate candidates across all open positions.</p>
        </div>
        <div className={styles.headerActions}>
           <button className={styles.secondaryBtn} onClick={handleExportCSV}>Export CSV</button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className={styles.statsRibbon}>
        <div className={styles.statItem}>
           <span className={styles.statLabel}>Total Candidates</span>
           <span className={styles.statValue}>{applicants.length}</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
           <span className={styles.statLabel}>Evaluated</span>
           <span className={styles.statValue}>{applicants.filter(a => a.ats_score !== null).length}</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
           <span className={styles.statLabel}>Top Match (75%+)</span>
           <span className={styles.statValue}>{applicants.filter(a => (a.ats_score || 0) >= 75).length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input 
            type="text" 
            placeholder="Search candidates, jobs, or skills..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
           <select 
             className={styles.selectFilter}
             value={jobFilter}
             onChange={(e) => setJobFilter(e.target.value)}
           >
              <option value="All Jobs">All Jobs</option>
              {uniqueJobs.map(job => (
                <option key={job} value={job}>{job}</option>
              ))}
           </select>
           <select 
             className={styles.selectFilter}
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
           >
              <option value="All Statuses">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
           </select>
        </div>
      </div>

      {/* Main Production Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loaderWrap}>
            <div className="loader" style={{ borderTopColor: "#3b82f6" }}></div>
            <span>Loading candidates...</span>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied For</th>
                <th>ATS Match</th>
                <th>Experience</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.candidateCell}>
                      <div className={styles.avatar}>{app.full_name[0]}</div>
                      <div>
                        <div className={styles.name}>{app.full_name}</div>
                        <div className={styles.email}>{app.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.jobTag}>{app.job_title}</span>
                  </td>
                  <td>
                    <div className={styles.scorePill} style={{ 
                      background: (app.ats_score || 0) >= 75 ? "#dcfce7" : (app.ats_score || 0) >= 50 ? "#fef9c3" : "#fee2e2",
                      color: (app.ats_score || 0) >= 75 ? "#166534" : (app.ats_score || 0) >= 50 ? "#854d0e" : "#991b1b"
                    }}>
                      {app.ats_score ?? 0}%
                    </div>
                  </td>
                  <td>
                    <span className={styles.expText}>{app.experience}</span>
                  </td>
                  <td>
                    <select 
                      disabled={app.status === "Hired"}
                      className={`${styles.statusSelect} ${
                        app.status === "Applied" ? styles.statusApplied :
                        app.status === "Evaluated" ? styles.statusEvaluated :
                        app.status === "In Process" ? styles.statusInProcess :
                        app.status === "Selected" ? styles.statusSelected :
                        app.status === "Hired" ? styles.statusHired :
                        app.status === "Rejected" ? styles.statusRejected : ""
                      }`}
                      style={{ cursor: app.status === "Hired" ? "not-allowed" : "pointer", opacity: app.status === "Hired" ? 0.8 : 1 }}
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Evaluated">Evaluated</option>
                      <option value="In Process">In Process</option>
                      <option value="Selected">Selected</option>
                      {app.status === "Hired" && <option value="Hired">Hired</option>}
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <button 
                        onClick={() => openDetail(app)}
                        className={styles.rowActionBtn} 
                        style={{ marginRight: 0 }}
                      >
                        Details
                      </button>
                      {app.status === "Selected" && (
                        <button 
                          onClick={() => openOfferModal(app)}
                          className={styles.rowActionBtn} 
                          style={{ marginRight: 0, color: "#7c3aed", borderColor: "#ede9fe", background: "#f5f3ff" }}
                        >
                          {app.offer_status === "Pending" ? "Resend Offer" : "Send Offer"}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(app.id)}
                        className={styles.rowActionBtn} 
                        style={{ marginRight: 0, color: "#ef4444", borderColor: "#fee2e2", background: "#fef2f2" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {showDetailModal && selectedApplicant && (
        <div style={{
            position: "fixed",
            top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
        }}>
            <div style={{
                background: "white",
                width: "100%",
                maxWidth: "700px",
                maxHeight: "90vh",
                borderRadius: "24px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
                {/* Modal Header */}
                <div style={{ padding: "2rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "56px", height: "56px", background: "#3b82f6", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "white", fontWeight: "700" }}>
                            {selectedApplicant.full_name[0]}
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b" }}>{selectedApplicant.full_name}</h2>
                            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>Applied for <span style={{ fontWeight: "600", color: "#3b82f6" }}>{selectedApplicant.job_title}</span></p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowDetailModal(false)}
                        style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "1.2rem", color: "#64748b" }}
                    >
                        ×
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: "2rem", overflowY: "auto", flex: 1 }}>
                    {/* Score Breakdown */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                        <div style={{ background: "#f1f5f9", padding: "1rem", borderRadius: "16px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.25rem" }}>Overall Score</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1e293b" }}>{selectedApplicant.ats_score}%</div>
                        </div>
                        <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: "16px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "#3b82f6", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.25rem" }}>Skills</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>{selectedApplicant.ats_details?.skill_match || "N/A"}</div>
                        </div>
                        <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "16px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "#22c55e", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.25rem" }}>Exp.</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>{selectedApplicant.ats_details?.experience_match || "N/A"}</div>
                        </div>
                        <div style={{ background: "#fdf2f8", padding: "1rem", borderRadius: "16px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "#ec4899", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.25rem" }}>Education</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>{selectedApplicant.ats_details?.education_match || "N/A"}</div>
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div style={{ background: (selectedApplicant.ats_score || 0) >= 75 ? "#f0fdf4" : "#fffbeb", padding: "1.25rem", borderRadius: "16px", border: "1px solid", borderColor: (selectedApplicant.ats_score || 0) >= 75 ? "#bbf7d0" : "#fef3c7", marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "1.2rem" }}>💡</span>
                            <span style={{ fontWeight: "700", color: (selectedApplicant.ats_score || 0) >= 75 ? "#166534" : "#854d0e" }}>AI Recommendation</span>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: (selectedApplicant.ats_score || 0) >= 75 ? "#166534" : "#854d0e", lineHeight: "1.5" }}>
                            {selectedApplicant.ats_details?.recommendation || "Processing candidate evaluation..."}
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                        {/* Strengths */}
                        <div>
                            <h4 style={{ fontSize: "0.875rem", fontWeight: "700", color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ color: "#22c55e" }}>✓</span> Key Strengths
                            </h4>
                            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                                {selectedApplicant.ats_details?.strengths.map((s, i) => (
                                    <li key={i} style={{ fontSize: "0.8125rem", color: "#475569", background: "#f8fafc", padding: "0.5rem 0.75rem", borderRadius: "8px", marginBottom: "0.5rem" }}>{s}</li>
                                ))}
                                {(!selectedApplicant.ats_details?.strengths || selectedApplicant.ats_details.strengths.length === 0) && <li style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>No strengths identified yet.</li>}
                            </ul>
                        </div>
                        {/* Missing Skills */}
                        <div>
                            <h4 style={{ fontSize: "0.875rem", fontWeight: "700", color: "#1e293b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ color: "#ef4444" }}>!</span> Potential Gaps
                            </h4>
                            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                                {selectedApplicant.ats_details?.missing_skills.map((s, i) => (
                                    <li key={i} style={{ fontSize: "0.8125rem", color: "#475569", background: "#fff1f2", padding: "0.5rem 0.75rem", borderRadius: "8px", marginBottom: "0.5rem" }}>{s}</li>
                                ))}
                                {(!selectedApplicant.ats_details?.missing_skills || selectedApplicant.ats_details.missing_skills.length === 0) && <li style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>No significant gaps found.</li>}
                            </ul>
                        </div>
                    </div>

                    <div style={{ marginTop: "2rem" }}>
                        <h4 style={{ fontSize: "0.875rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.75rem" }}>Candidate Statement (Skills & Exp)</h4>
                        <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", fontSize: "0.8125rem", color: "#64748b", lineHeight: "1.6", border: "1px solid #e2e8f0" }}>
                            <strong>Skills:</strong> {selectedApplicant.skills}<br /><br />
                            <strong>Experience:</strong> {selectedApplicant.experience}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", gap: "1rem" }}>
                    <button 
                        onClick={() => setShowDetailModal(false)}
                        style={{ flex: 1, padding: "0.75rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                    >
                        Close
                    </button>
                    <button 
                        className="premium-btn"
                        disabled={selectedApplicant.status === "Hired"}
                        style={{ 
                            flex: 1, 
                            padding: "0.75rem", 
                            borderRadius: "12px", 
                            background: selectedApplicant.status === "Hired" ? "#16a34a" : undefined,
                            cursor: selectedApplicant.status === "Hired" ? "not-allowed" : "pointer",
                            opacity: selectedApplicant.status === "Hired" ? 0.9 : 1
                        }}
                        onClick={() => {
                            const nextStatus = selectedApplicant.status === "Evaluated" ? "In Process" : 
                                             selectedApplicant.status === "In Process" ? "Selected" : 
                                             selectedApplicant.status === "Selected" ? "Selected" : "In Process";
                            if (selectedApplicant.status === "Selected") {
                                alert("Candidate is already selected. Send an offer letter to proceed to hiring.");
                                return;
                            }
                            handleStatusUpdate(selectedApplicant.id, nextStatus);
                        }}
                    >
                        {selectedApplicant.status === "Hired" ? "✓ Hired" : 
                         selectedApplicant.status === "Selected" ? "Send Offer" :
                         selectedApplicant.status === "In Process" ? "Mark Selected" : "Move to Interview"}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && selectedApplicant && (
        <div style={{
            position: "fixed",
            top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
        }}>
            <div style={{
                background: "white",
                width: "100%",
                maxWidth: "450px",
                borderRadius: "24px",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>Send Job Offer</h2>
                <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem" }}>
                  Sending offer to <strong style={{ color: "#1e293b" }}>{selectedApplicant.full_name}</strong> for the <strong style={{ color: "#1e293b" }}>{selectedApplicant.job_title}</strong> position.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "0.4rem" }}>Salary</label>
                    <input 
                      type="text" placeholder="e.g. $80,000" 
                      value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)}
                      style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "0.4rem" }}>Start Date</label>
                    <input 
                      type="text" placeholder="e.g. May 15, 2026" 
                      value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)}
                      style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "0.4rem" }}>Reporting Manager</label>
                    <input 
                      type="text" placeholder="e.g. John Doe" 
                      value={managerInput} onChange={(e) => setManagerInput(e.target.value)}
                      style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "0.4rem" }}>Deadline</label>
                    <input 
                      type="text" placeholder="e.g. May 05" 
                      value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)}
                      style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button 
                    onClick={() => setShowOfferModal(false)}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendOffer}
                    disabled={sendingOffer || !salaryInput}
                    style={{ 
                      flex: 1, 
                      padding: "0.75rem", 
                      borderRadius: "12px", 
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)", 
                      color: "white", 
                      fontWeight: "600", 
                      cursor: "pointer",
                      border: "none",
                      opacity: (sendingOffer || !salaryInput) ? 0.7 : 1
                    }}
                  >
                    {sendingOffer ? "Sending..." : "Send Offer"}
                  </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
