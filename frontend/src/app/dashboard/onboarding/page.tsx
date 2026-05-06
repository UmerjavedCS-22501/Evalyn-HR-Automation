"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import styles from "./onboarding.module.css";

interface HiredCandidate {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  start_date: string | null;
  reporting_manager: string | null;
  status: string;
  onboarding_status: string;
  training_progress: number;
}

export default function OnboardingPage() {
  const [candidates, setCandidates] = useState<HiredCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const fetchCandidateDetails = (id: number) => {
    fetch(`${API_BASE_URL}/applications/${id}/onboarding`)
      .then(res => res.json())
      .then(data => setSelectedCandidate(data))
      .catch(err => console.error(err));
  };

  const fetchCandidates = () => {
    const userStr = localStorage.getItem("user");
    let url = `${API_BASE_URL}/applications/hired`;
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.id) {
        url += `?user_id=${user.id}`;
      }
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(err => console.error("Fetch error", err))
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchCandidates();
  }, []);

  const sendOnboardingLink = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/${id}/send-onboarding-link`, {
        method: "POST"
      });
      if (res.ok) alert("Onboarding link sent to candidate!");
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "#94a3b8";
      case "info_completed": return "#3b82f6";
      case "docs_uploaded": return "#8b5cf6";
      case "policy_accepted": return "#f59e0b";
      case "onboarding_completed": return "#10b981";
      default: return "#64748b";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Onboarding Dashboard</h1>
          <p className={styles.subtitle}>Manage and track newly hired candidates.</p>
        </div>
      </div>

      <div className={styles.statsRibbon}>
        <div className={styles.statItem}>
           <span className={styles.statLabel}>Total New Hires</span>
           <span className={styles.statValue}>{candidates.length}</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
           <span className={styles.statLabel}>In Progress</span>
           <span className={styles.statValue}>{candidates.filter(c => c.onboarding_status !== "onboarding_completed").length}</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
           <span className={styles.statLabel}>Completed</span>
           <span className={styles.statValue}>{candidates.filter(c => c.onboarding_status === "onboarding_completed").length}</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loaderWrap}>
            <div className="loader" style={{ borderTopColor: "#3b82f6" }}></div>
            <span>Loading candidates...</span>
          </div>
        ) : candidates.length === 0 ? (
           <div className={styles.emptyState}>
             No hired candidates found. Send offers from the Applications page!
           </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Step Status</th>
                <th>Training</th>
                <th>Reporting To</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.candidateCell}>
                      <div className={styles.avatar}>{candidate.full_name[0]}</div>
                      <div>
                        <div className={styles.name}>{candidate.full_name}</div>
                        <div className={styles.email}>{candidate.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.jobTag}>{candidate.job_title}</span>
                  </td>
                  <td>
                    <span 
                      className={styles.statusBadge} 
                      style={{ 
                        backgroundColor: `${getStatusColor(candidate.onboarding_status)}15`, 
                        color: getStatusColor(candidate.onboarding_status),
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {candidate.onboarding_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className={styles.progressContainer}>
                       <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{
                                width: `${candidate.training_progress}%`,
                                backgroundColor: candidate.training_progress === 100 ? "#10b981" : "#3b82f6"
                            }}
                          ></div>
                       </div>
                       <span className={styles.progressText}>{candidate.training_progress}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.managerText}>{candidate.reporting_manager || "Unassigned"}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                            className={styles.actionBtn}
                            onClick={() => sendOnboardingLink(candidate.id)}
                            disabled={processing === candidate.id}
                            style={{ background: '#f1f5f9', color: '#475569' }}
                        >
                            {processing === candidate.id ? "Sending..." : "📧 Send Link"}
                        </button>
                        <button 
                          className={styles.actionBtn}
                          onClick={() => fetchCandidateDetails(candidate.id)}
                          style={{ background: '#2563eb', color: 'white' }}
                        >
                            Review
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCandidate && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCandidate(null)}>
          <div className={styles.detailsSidebar} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedCandidate(null)}>✕</button>
            
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className={styles.largeAvatar}>
                {selectedCandidate.profile_pic ? (
                  <img 
                    src={`${API_BASE_URL}/uploads/onboarding/${selectedCandidate.profile_pic.split(/[\\/]/).pop()}`} 
                    alt="Profile" 
                    className={styles.avatarImg}
                  />
                ) : (
                  selectedCandidate.full_name[0]
                )}
              </div>
              <div>
                <h2 style={{ margin: '0 0 5px', color: '#0f172a' }}>{selectedCandidate.full_name}</h2>
                <p style={{ margin: 0, color: '#64748b' }}>{selectedCandidate.job_title} • {selectedCandidate.email}</p>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h3>Personal Information</h3>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>CNIC / ID Number</span>
                <span className={styles.detailValue}>{selectedCandidate.cnic_number || "Not provided"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Address</span>
                <span className={styles.detailValue}>{selectedCandidate.address || "Not provided"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Emergency Contact</span>
                <span className={styles.detailValue}>{selectedCandidate.emergency_contact || "Not provided"}</span>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h3>Payroll & Bank Details</h3>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Bank Account / IBAN</span>
                <span className={styles.detailValue}>{selectedCandidate.bank_details || "Not provided"}</span>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h3>Onboarding Documents</h3>
              {selectedCandidate.docs.cnic ? (
                <a href={`${API_BASE_URL}/uploads/onboarding/${selectedCandidate.docs.cnic.split('\\').pop()}`} target="_blank" className={styles.docLink}>
                  📄 CNIC / National ID
                </a>
              ) : <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>CNIC not uploaded</p>}
              
              {selectedCandidate.docs.degree ? (
                <a href={`${API_BASE_URL}/uploads/onboarding/${selectedCandidate.docs.degree.split('\\').pop()}`} target="_blank" className={styles.docLink}>
                  🎓 Educational Degree
                </a>
              ) : <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Degree not uploaded</p>}
              
              {selectedCandidate.docs.experience ? (
                <a href={`${API_BASE_URL}/uploads/onboarding/${selectedCandidate.docs.experience.split('\\').pop()}`} target="_blank" className={styles.docLink}>
                  💼 Experience Letter
                </a>
              ) : <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Experience letter not uploaded</p>}
            </div>

            <div className={styles.detailSection}>
              <h3>Legal & Compliance</h3>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Policy & NDA Accepted</span>
                <span className={styles.detailValue} style={{ color: selectedCandidate.policy_accepted === "Yes" ? "#10b981" : "#ef4444" }}>
                  {selectedCandidate.policy_accepted === "Yes" ? "✅ Accepted" : "❌ Pending"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '40px' }}>
               <button 
                className={styles.actionBtn} 
                style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white' }}
                onClick={() => {
                    alert("Onboarding verified and finalized!");
                    setSelectedCandidate(null);
                }}
               >
                 Verify & Finalize Onboarding
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
