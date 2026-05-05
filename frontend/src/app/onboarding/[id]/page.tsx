"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config";
import styles from "./onboarding.module.css";

interface OnboardingData {
  id: number;
  full_name: string;
  email: string;
  job_title: string;
  address: string | null;
  cnic_number: string | null;
  phone_number: string | null;
  emergency_contact: string | null;
  bank_details: string | null;
  policy_accepted: string;
  training_progress: number;
  onboarding_status: string;
  reporting_manager: string | null;
  profile_pic: string | null;
}

const STEPS = [
  { id: 1, title: "Personal Info", desc: "Your basic details" },
  { id: 2, title: "Documents", desc: "Upload ID & Degrees" },
  { id: 3, title: "Policy & NDA", desc: "Legal agreements" },
  { id: 4, title: "Training", desc: "Orientation & Tasks" },
  { id: 5, title: "Final Step", desc: "Manager & Completion" }
];

export default function CandidateOnboarding() {
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [form, setForm] = useState({
    address: "",
    cnic: "",
    phone_number: "",
    emergency_contact: "",
    bank_details: ""
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profile_pic: null,
    cnic: null,
    degree: null,
    experience: null
  });

  const [policyAccepted, setPolicyAccepted] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/applications/${id}/onboarding`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setForm({
          address: d.address || "",
          cnic: d.cnic_number || "",
          phone_number: d.phone_number || "",
          emergency_contact: d.emergency_contact || "",
          bank_details: d.bank_details || ""
        });
        setPolicyAccepted(d.policy_accepted === "Yes");
        
        // Determine current step based on status
        if (d.onboarding_status === "Pending") setCurrentStep(1);
        else if (d.onboarding_status === "info_completed") setCurrentStep(2);
        else if (d.onboarding_status === "docs_uploaded") setCurrentStep(3);
        else if (d.onboarding_status === "policy_accepted") setCurrentStep(4);
        else if (d.onboarding_status === "onboarding_completed") setCurrentStep(5);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleNext = async () => {
    if (data?.onboarding_status === "onboarding_completed") return;

    setSaving(true);
    try {
      if (currentStep === 1) {
        if (!form.address || !form.cnic || !form.phone_number) {
            alert("Address, CNIC, and Phone Number are required.");
            setSaving(false);
            return;
        }
        await fetch(`${API_BASE_URL}/applications/${id}/personal-info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      } else if (currentStep === 2) {
        // Validation: Profile Pic, CNIC, and Experience are mandatory
        if (!files.profile_pic && !data?.profile_pic) { alert("Profile picture is required."); setSaving(false); return; }
        if (!files.cnic && !data?.docs.cnic) { alert("CNIC document is required."); setSaving(false); return; }
        if (!files.experience && !data?.docs.experience) { alert("Experience letter is required."); setSaving(false); return; }

        const formData = new FormData();
        if (files.profile_pic) formData.append("profile_pic", files.profile_pic);
        if (files.cnic) formData.append("cnic", files.cnic);
        if (files.degree) formData.append("degree", files.degree);
        if (files.experience) formData.append("experience", files.experience);
        
        await fetch(`${API_BASE_URL}/applications/${id}/upload-docs`, {
          method: "POST",
          body: formData
        });
      } else if (currentStep === 3) {
        if (!policyAccepted) {
            alert("Please accept the policies to continue.");
            setSaving(false);
            return;
        }
        await fetch(`${API_BASE_URL}/applications/${id}/accept-policy`, { method: "POST" });
      } else if (currentStep === 4) {
        // Mock training completion for now
        await fetch(`${API_BASE_URL}/applications/${id}/update-training`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress: 100 })
        });
      }
      
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loaderWrap}>
        <div className="loader"></div>
        <p>Loading your onboarding profile...</p>
      </div>
    </div>
  );

  if (!data) return <div className={styles.container}>Candidate profile not found.</div>;

  const progress = (currentStep / 5) * 100;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome to US Tech</h1>
        <p className={styles.subtitle}>Onboarding for <strong>{data.job_title}</strong> role</p>
      </header>

      <div className={styles.progressWrapper}>
        <div className={styles.progressLabel}>
           <span>Onboarding Progress</span>
           <span>{Math.round(progress)}%</span>
        </div>
        <div className={styles.progressBar}>
           <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className={styles.onboardingCard}>
        <aside className={styles.sidebar}>
          {STEPS.map(step => (
            <div 
              key={step.id} 
              className={`${styles.stepItem} ${currentStep === step.id ? styles.stepActive : ""} ${currentStep > step.id ? styles.stepCompleted : ""}`}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
            >
              <div className={styles.stepNumber}>{currentStep > step.id ? "✓" : step.id}</div>
              <div>
                <div style={{ fontSize: '0.9rem' }}>{step.title}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </aside>

        <main className={styles.mainContent}>
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Personal Information</h2>
              <p className={styles.stepDesc}>Please provide your details for HR records and payroll.</p>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input className={styles.input} value={data.full_name} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>CNIC / National ID *</label>
                  <input 
                    className={styles.input} 
                    placeholder="e.g. 12345-6789012-3" 
                    value={form.cnic}
                    onChange={e => setForm({...form, cnic: e.target.value})}
                    disabled={data.onboarding_status === "onboarding_completed"}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number *</label>
                  <input 
                    className={styles.input} 
                    placeholder="e.g. +92 300 1234567" 
                    value={form.phone_number}
                    onChange={e => setForm({...form, phone_number: e.target.value})}
                    disabled={data.onboarding_status === "onboarding_completed"}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Current Address *</label>
                  <textarea 
                    className={styles.textarea} 
                    placeholder="Your complete residential address"
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                    disabled={data.onboarding_status === "onboarding_completed"}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Emergency Contact</label>
                  <input 
                    className={styles.input} 
                    placeholder="Name & Phone Number"
                    value={form.emergency_contact}
                    onChange={e => setForm({...form, emergency_contact: e.target.value})}
                    disabled={data.onboarding_status === "onboarding_completed"}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Bank Details (IBAN/Account)</label>
                  <input 
                    className={styles.input} 
                    placeholder="For salary processing"
                    value={form.bank_details}
                    onChange={e => setForm({...form, bank_details: e.target.value})}
                    disabled={data.onboarding_status === "onboarding_completed"}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Document Upload</h2>
              <p className={styles.stepDesc}>Upload scanned copies of your official documents.</p>
              
              <div className={styles.uploadList}>
                <div className={styles.uploadItem}>
                  <div className={styles.uploadInfo}>
                    <h4>Profile Picture *</h4>
                    <p>{files.profile_pic ? files.profile_pic.name : data.profile_pic ? "✅ Already Uploaded" : "Recent professional photo"}</p>
                  </div>
                  <label className={`${styles.uploadLabel} ${data.onboarding_status === "onboarding_completed" ? styles.disabledUpload : ""}`}>
                    {files.profile_pic || data.profile_pic ? "Change" : "Upload"}
                    <input type="file" className={styles.fileInput} disabled={data.onboarding_status === "onboarding_completed"} onChange={e => setFiles({...files, profile_pic: e.target.files?.[0] || null})} />
                  </label>
                </div>

                <div className={styles.uploadItem}>
                  <div className={styles.uploadInfo}>
                    <h4>CNIC / National ID *</h4>
                    <p>{files.cnic ? files.cnic.name : data.docs.cnic ? "✅ Already Uploaded" : "Front & Back (Merged PDF or Image)"}</p>
                  </div>
                  <label className={`${styles.uploadLabel} ${data.onboarding_status === "onboarding_completed" ? styles.disabledUpload : ""}`}>
                    {files.cnic || data.docs.cnic ? "Change" : "Upload"}
                    <input type="file" className={styles.fileInput} disabled={data.onboarding_status === "onboarding_completed"} onChange={e => setFiles({...files, cnic: e.target.files?.[0] || null})} />
                  </label>
                </div>

                <div className={styles.uploadItem}>
                  <div className={styles.uploadInfo}>
                    <h4>Latest Degree / Certificate</h4>
                    <p>{files.degree ? files.degree.name : data.docs.degree ? "✅ Already Uploaded" : "Educational qualification proof"}</p>
                  </div>
                  <label className={`${styles.uploadLabel} ${data.onboarding_status === "onboarding_completed" ? styles.disabledUpload : ""}`}>
                    {files.degree || data.docs.degree ? "Change" : "Upload"}
                    <input type="file" className={styles.fileInput} disabled={data.onboarding_status === "onboarding_completed"} onChange={e => setFiles({...files, degree: e.target.files?.[0] || null})} />
                  </label>
                </div>

                <div className={styles.uploadItem}>
                  <div className={styles.uploadInfo}>
                    <h4>Experience Letter *</h4>
                    <p>{files.experience ? files.experience.name : data.docs.experience ? "✅ Already Uploaded" : "Previous company certificate"}</p>
                  </div>
                  <label className={`${styles.uploadLabel} ${data.onboarding_status === "onboarding_completed" ? styles.disabledUpload : ""}`}>
                    {files.experience || data.docs.experience ? "Change" : "Upload"}
                    <input type="file" className={styles.fileInput} disabled={data.onboarding_status === "onboarding_completed"} onChange={e => setFiles({...files, experience: e.target.files?.[0] || null})} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Policies & NDA</h2>
              <p className={styles.stepDesc}>Please review our company policy and sign the NDA.</p>
              
              <div className={styles.policyBox}>
                <h3>1. Code of Conduct</h3>
                <p>US Tech maintains a professional environment. We value integrity, innovation, and respect for all team members. Harassment of any kind is strictly prohibited.</p>
                
                <h3>2. Intellectual Property (NDA)</h3>
                <p>All work produced during your tenure at US Tech remains the exclusive property of the company. You agree not to disclose any sensitive trade secrets or client data to third parties.</p>
                
                <h3>3. Working Hours</h3>
                <p>Standard working hours are 9:00 AM to 6:00 PM, Monday to Friday. Flexibility is available with manager approval.</p>
                
                <h3>4. Data Privacy</h3>
                <p>We respect your privacy. All your personal data provided in this onboarding process will be used solely for HR and legal purposes.</p>
              </div>

              <div className={styles.acceptRow}>
                <input 
                    type="checkbox" 
                    className={styles.checkbox} 
                    checked={policyAccepted}
                    onChange={e => setPolicyAccepted(e.target.checked)}
                    disabled={data.onboarding_status === "onboarding_completed"}
                />
                <label>I have read and I accept the US Tech Policies and NDA agreements.</label>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Training & Resources</h2>
              <p className={styles.stepDesc}>Get familiar with our workflow and tools.</p>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                   <h4 style={{ margin: '0 0 5px' }}>🎬 Welcome Video</h4>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Watch a 5-minute introduction from our CEO.</p>
                </div>
                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                   <h4 style={{ margin: '0 0 5px' }}>📚 Developer Documentation</h4>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Read our coding standards and architecture guide.</p>
                </div>
                <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                   <h4 style={{ margin: '0 0 5px' }}>🛠 Environment Setup</h4>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Follow the guide to set up your local workspace.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className={styles.stepContent}>
              <div className={styles.successState}>
                <div className={styles.successIcon}>🎉</div>
                <h2 className={styles.stepTitle}>Onboarding Completed!</h2>
                <p className={styles.stepDesc}>You're all set! Below is a summary of the information you've submitted for HR verification.</p>
                
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <label>Full Name</label>
                    <div>{data.full_name}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <label>CNIC / ID</label>
                    <div>{form.cnic}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <label>Phone</label>
                    <div>{form.phone_number}</div>
                  </div>
                  <div className={styles.summaryItem}>
                    <label>Emergency Contact</label>
                    <div>{form.emergency_contact || "N/A"}</div>
                  </div>
                  <div className={styles.summaryItem} style={{ gridColumn: "span 2" }}>
                    <label>Address</label>
                    <div>{form.address}</div>
                  </div>
                  <div className={styles.summaryItem} style={{ gridColumn: "span 2" }}>
                    <label>Documents Provided</label>
                    <div className={styles.docChecklist}>
                      <span>✅ Profile Picture</span>
                      <span>✅ CNIC Copy</span>
                      <span>✅ Experience Letter</span>
                      {data.docs?.degree && <span>✅ Educational Degree</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.managerBadge}>
                   <h4>Your Assigned Manager</h4>
                   <div className={styles.managerInfo}>
                      <div className={styles.managerAvatar}>{(data.reporting_manager || "H")[0]}</div>
                      <div style={{ textAlign: 'left' }}>
                         <div style={{ fontWeight: 700, color: '#1e3a8a' }}>{data.reporting_manager || "HR Operations"}</div>
                         <div style={{ fontSize: '0.85rem', color: '#60a5fa' }}>Reporting Manager</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {currentStep < 5 && (
            <div className={styles.buttonGroup}>
              <button 
                className={styles.nextBtn} 
                onClick={handleNext}
                disabled={saving}
              >
                {saving ? "Saving..." : currentStep === 4 ? "Complete Onboarding" : "Save & Continue"}
              </button>
              {data.onboarding_status === "onboarding_completed" && (
                <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                   🔒 Form is locked. Contact HR for any corrections.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
