"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./offer.module.css";

export default function OfferPage() {
  const { id } = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responded, setResponded] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8000/applications/${id}/public`)
        .then((res) => {
          if (!res.ok) throw new Error("Offer not found");
          return res.json();
        })
        .then((data) => setOffer(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleResponse = async (newStatus: "Accepted" | "Rejected") => {
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this offer?`)) return;

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/applications/${id}/offer-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setResponded(true);
        setStatus(newStatus);
      } else {
        alert("Failed to submit response.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your offer...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className={styles.errorContainer}>
        <h1>Offer Not Found</h1>
        <p>The offer link you followed may be invalid or expired.</p>
      </div>
    );
  }

  if (responded || offer.offer_status === "Accepted" || offer.offer_status === "Rejected") {
    const finalStatus = responded ? status : offer.offer_status;
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <div className={styles.icon}>{finalStatus === "Accepted" ? "🎉" : "✉️"}</div>
          <h1>{finalStatus === "Accepted" ? "Offer Accepted!" : "Response Received"}</h1>
          <p>
            {finalStatus === "Accepted"
              ? "Congratulations! You have accepted the offer. Our team will contact you shortly with the next steps."
              : "Thank you for your response. We have updated our records accordingly."}
          </p>
          <button className={styles.homeBtn} onClick={() => window.location.href = "/"}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.offerCard}>
        <div className={styles.header}>
          <div className={styles.logo}>US Tech</div>
          <div className={styles.badge}>Official Job Offer</div>
        </div>

        <div className={styles.content}>
          <div className={styles.intro}>
            <h1>Hello, {offer.full_name}!</h1>
            <p>We are excited to officially invite you to join the team at <strong>US Tech</strong>.</p>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label>Position</label>
              <div className={styles.value}>{offer.job_title}</div>
            </div>
            <div className={styles.detailItem}>
              <label>Proposed Salary</label>
              <div className={styles.salaryValue}>{offer.salary}</div>
            </div>
            <div className={styles.detailItem}>
              <label>Start Date</label>
              <div className={styles.value}>{offer.start_date || "TBD"}</div>
            </div>
            <div className={styles.detailItem}>
              <label>Reporting To</label>
              <div className={styles.value}>{offer.reporting_manager || "HR Manager"}</div>
            </div>
            <div className={styles.detailItem}>
              <label>Respond By</label>
              <div className={styles.value}>{offer.acceptance_deadline || "7 days"}</div>
            </div>
            <div className={styles.detailItem}>
              <label>Location</label>
              <div className={styles.value}>GT road Roshen PLAZA 2nd floor</div>
            </div>
          </div>

          <div className={styles.terms}>
            <h3>Summary of Terms</h3>
            <p>
              By accepting this offer, you agree to the terms and conditions discussed during the interview process. 
              A formal contract and onboarding materials will be sent to you upon acceptance.
            </p>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.rejectBtn} 
              onClick={() => handleResponse("Rejected")}
              disabled={submitting}
            >
              Decline Offer
            </button>
            <button 
              className={styles.acceptBtn} 
              onClick={() => handleResponse("Accepted")}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Accept Job Offer"}
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          Questions? Contact us at umerawan.revnix@gmail.com
        </div>
      </div>
    </div>
  );
}
