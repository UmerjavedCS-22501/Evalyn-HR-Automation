"use client";

import React from "react";
import Link from "next/link";

export default function JobsPage() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Jobs</h1>
        <Link href="/dashboard/jobs/new" className="premium-btn" style={{ padding: "0.75rem 1.5rem" }}>
          + Create New Job
        </Link>
      </div>
      <div className="glass-container" style={{ padding: "3rem", textAlign: "center", borderRadius: "20px" }}>
        <p style={{ color: "#94a3b8" }}>Job listing will appear here.</p>
      </div>
    </div>
  );
}
