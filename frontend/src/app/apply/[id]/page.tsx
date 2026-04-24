"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "../../page.module.css"; // Reuse general styles or create apply.module.css
import successStyles from "../../success/success.module.css";

export default function ApplyPage() {
  const params = useParams();
  const id = params.id;
  
  const [job, setJob] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch job details to show the candidate what they are applying for
    const fetchJob = async () => {
      try {
        const response = await fetch(`http://localhost:8000/job/${id}`);
        const data = await response.json();
        setJob(data);
      } catch (err) {
        console.error("Failed to fetch job details");
      }
    };
    if (id) fetchJob();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cv) return setError("Please upload your CV");
    
    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("skills", skills);
    formData.append("experience", experience);
    formData.append("cover_letter", coverLetter);
    formData.append("cv", cv);

    try {
      const response = await fetch(`http://localhost:8000/applications/apply/${id}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.detail || "Submission failed");
      }
    } catch (err: any) {
      setError("Connection failed. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className={styles.main}>
        <div className={`${successStyles.container} glass-container`}>
          <h2 style={{ color: "#10b981", marginBottom: "1rem" }}>Application Submitted!</h2>
          <p style={{ color: "#94a3b8" }}>Thank you for your interest. The hiring team has received your details.</p>
          <button className="premium-btn" onClick={() => window.location.href = "/"} style={{ marginTop: "2rem", padding: "12px 30px" }}>
            Return to Evalyn
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={`${styles.container} glass-container`} style={{ maxWidth: '700px', marginTop: '6rem' }}>
        <h1 className={styles.title}>Apply for Position</h1>
        {job && <p className={styles.subtitle}>Position: {job.title}</p>}

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.aiForm}>
          <div className={styles.inputGroup}>
            <label>Full Name</label>
            <input type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input type="email" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Professional Skills</label>
            <textarea 
              style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white' }} 
              placeholder="e.g. Python, Next.js, AI Models..." 
              rows={3}
              required 
              value={skills} 
              onChange={(e) => setSkills(e.target.value)} 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Years of Experience</label>
            <input type="text" placeholder="e.g. 5 Years" required value={experience} onChange={(e) => setExperience(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label>Cover Letter (Optional)</label>
            <textarea 
              style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white' }} 
              placeholder="Tell us why you are a good fit..." 
              rows={4}
              value={coverLetter} 
              onChange={(e) => setCoverLetter(e.target.value)} 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Upload CV (Resume)</label>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx" 
              required 
              onChange={(e) => setCv(e.target.files?.[0] || null)}
              style={{ color: '#94a3b8', fontSize: '0.9rem' }}
            />
          </div>

          <button type="submit" className="premium-btn" disabled={isSubmitting} style={{ width: "100%", padding: "16px 0", marginTop: "1rem" }}>
            {isSubmitting ? "Submitting Application..." : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}
