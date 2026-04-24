"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./new-job.module.css";

export default function NewJobPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prompt, setPrompt] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    experience: "Mid-Level",
    skills: "",
    responsibilities: "",
    qualifications: "",
    min_salary: 0,
    max_salary: 0,
    currency: "PKR",
    period: "Monthly",
    salary_note: "",
    description: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes("salary") ? parseInt(value) || 0 : value
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!prompt) return alert("Please enter a prompt first");
    
    setIsGenerating(true);
    try {
      const res = await fetch(`http://localhost:8000/generate-structure?prompt=${encodeURIComponent(prompt)}`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          department: data.department || prev.department,
          location: data.location || prev.location,
          type: data.type || prev.type,
          experience: data.experience || prev.experience,
          skills: Array.isArray(data.skills) ? data.skills.join(", ") : data.skills,
          responsibilities: data.responsibilities || prev.responsibilities,
          qualifications: data.qualifications || prev.qualifications,
          min_salary: data.min_salary || prev.min_salary,
          max_salary: data.max_salary || prev.max_salary,
          currency: data.currency || prev.currency,
          period: data.period || prev.period,
          salary_note: data.salary_note || prev.salary_note,
          description: data.description || prev.description
        }));
      } else {
        alert("AI Extraction failed: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Connection failed: " + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("http://localhost:8000/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/jobs`);
      } else {
        const errData = await res.json();
        alert("Error creating job: " + (errData.detail || "Unknown error"));
      }
    } catch (err) {
      alert("Submission failed: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Create New Job</h1>
        <div className={styles.stepIndicator}>
          <span>Step 1 of 3</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      </header>

      <div className={`${styles.formCard} glass-container`}>
        <div className={styles.sectionTitle}>
          <span>💼</span> Job Details
        </div>
        <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.5rem" }}>
          Describe the role in natural language — or fill in the fields below.
        </p>

        {/* AI Prompt Section */}
        <div className={styles.aiBox}>
          <div className={styles.aiHeader}>
            <div className={styles.aiBadge}>
              <span>✨</span> Generate with AI
            </div>
            <span style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: "600" }}>Recommended</span>
          </div>
          <textarea
            className={styles.promptInput}
            placeholder="e.g. 'Create a job description for a Senior React Developer at a fintech startup, 5+ years experience, TypeScript, system design, remote-friendly, competitive salary...'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button 
            className={styles.generateBtn} 
            onClick={handleGenerateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? <div className={styles.loader}></div> : "✨"}
            {isGenerating ? "Generating..." : "Generate JD"}
          </button>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "1rem" }}>
            AI will extract the Job title, department, skills and generate a complete JD. All fields below will be auto-filled.
          </p>
        </div>

        <div className={styles.separator}>Or fill in details manually</div>

        {/* Manual Form */}
        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label>Job Title</label>
              <input
                name="title"
                placeholder="e.g. Senior Product Designer"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Department</label>
              <input
                name="department"
                placeholder="e.g. Design"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Location</label>
              <input
                name="location"
                placeholder="e.g. Remote / New York"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleInputChange}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Experience Required</label>
              <select name="experience" value={formData.experience} onChange={handleInputChange}>
                <option>Entry-Level</option>
                <option>Mid-Level</option>
                <option>Senior-Level</option>
                <option>Executive</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Required Skills</label>
              <input
                name="skills"
                placeholder="e.g. React, Node.js, AWS"
                value={formData.skills}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className={styles.grid} style={{ marginTop: "1rem" }}>
            <div className={styles.inputGroup}>
              <label>Job Responsibilities</label>
              <textarea
                name="responsibilities"
                placeholder="Describe core tasks..."
                rows={2}
                value={formData.responsibilities}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Qualifications / Education</label>
              <textarea
                name="qualifications"
                placeholder="Required education/certs..."
                rows={2}
                value={formData.qualifications}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Min Salary</label>
              <input
                type="number"
                name="min_salary"
                value={formData.min_salary}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Max Salary</label>
              <input
                type="number"
                name="max_salary"
                value={formData.max_salary}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.inputGroup} style={{ width: "200px" }}>
              <label>Currency</label>
              <select name="currency" value={formData.currency} onChange={handleInputChange}>
                <option>PKR</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
            <div className={styles.inputGroup} style={{ width: "200px" }}>
              <label>Period</label>
              <select name="period" value={formData.period} onChange={handleInputChange}>
                <option>Monthly</option>
                <option>Yearly</option>
                <option>Hourly</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginTop: "1rem" }}>
            <label>Salary Note (Optional)</label>
            <input
              name="salary_note"
              placeholder="e.g. Negotiable, Depends on Experience"
              value={formData.salary_note}
              onChange={handleInputChange}
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="premium-btn" 
              style={{ padding: "0.875rem 2.5rem" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <div className={styles.loader}></div> : "Next Step"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
