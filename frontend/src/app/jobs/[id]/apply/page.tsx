"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "./apply.module.css";

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
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      console.log("Fetching details for Job ID:", id);
      try {
        const response = await fetch(`http://localhost:8000/job/${id}`);
        if (!response.ok) {
          setError("Job position not found. It may have been removed or the link is invalid.");
          setLoading(false);
          return;
        }
        const data = await response.json();
        setJob(data);
      } catch (err) {
        console.error("Failed to fetch job details", err);
        setError("Unable to connect to the server. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
    else {
      setError("No job ID provided.");
      setLoading(false);
    }
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
      setError("Connection failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#1e1b4b" }}>Application Sent!</h2>
          <p style={{ color: "#64748b", marginBottom: "2.5rem" }}>
            The hiring team for <strong>{job?.title}</strong> has received your application. Good luck!
          </p>
          <button className="premium-btn" onClick={() => window.location.href = "/"} style={{ padding: "1rem 2.5rem" }}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>✨</div>
            Evalyn
          </div>
        </div>
      </nav>

      <div className={styles.container}>
        <div className={styles.formCard}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
               <div className="loader" style={{ margin: "0 auto 1rem" }}></div>
               <p style={{ color: "#64748b" }}>Loading position details...</p>
            </div>
          ) : error && !job ? (
             <div className={styles.errorBanner}>
               <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
               {error}
               <button 
                 onClick={() => window.location.reload()} 
                 className={styles.secondaryBtn}
                 style={{ marginTop: "1rem", width: "100%" }}
               >
                 Retry Connection
               </button>
             </div>
          ) : (
            <>
              <div className={styles.header}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#1e1b4b", marginBottom: "0.5rem" }}>
                  Apply for Position
                </h1>
                {job && <p style={{ color: "#3b82f6", fontWeight: "600" }}>{job.title}</p>}
              </div>

              {error && <div className={styles.errorBanner}>{error}</div>}

              <form onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Professional Skills</label>
              <textarea 
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
                placeholder="Tell us why you are a good fit..." 
                rows={4}
                value={coverLetter} 
                onChange={(e) => setCoverLetter(e.target.value)} 
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Upload CV (Resume)</label>
              <div className={styles.fileUpload}>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  required 
                  onChange={(e) => setCv(e.target.files?.[0] || null)}
                />
                <div className={styles.fileLabel}>
                   {cv ? cv.name : "Drag and drop or click to upload PDF"}
                </div>
              </div>
            </div>

            <button type="submit" className="premium-btn" disabled={isSubmitting} style={{ width: "100%", padding: "1.25rem", marginTop: "1rem", fontSize: "1.1rem" }}>
              {isSubmitting ? "Sending..." : "Submit Application"}
            </button>
            </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
