"use client";

import React, { useState } from "react";

export default function IntegrationsPage() {
  const [integrations] = useState([
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "🔗",
      description: "Auto-post job architect results directly to your feed.",
      status: "Connected",
      btnText: "Reconnect",
      btnUrl: "http://localhost:8000/auth/linkedin"
    },
    {
      id: "google_calendar",
      name: "Google Calendar",
      icon: "📅",
      description: "Automatically schedule interviews with top-scoring candidates.",
      status: "Not Connected",
      btnText: "Connect Now",
      btnUrl: "http://localhost:8000/google/login"
    },
    {
      id: "gmail",
      name: "Gmail / SMTP",
      icon: "📧",
      description: "Send professional interview invites and rejection emails.",
      status: "Configured",
      btnText: "Test Connection",
      btnUrl: "#"
    }
  ]);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>Integrations</h1>
      <p style={{ color: "#64748b", marginBottom: "2.5rem" }}>Connect your external accounts to automate your recruitment workflow.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {integrations.map((item) => (
          <div key={item.id} style={{ background: "white", padding: "2rem", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ width: "48px", height: "48px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                {item.icon}
              </div>
              <span style={{ 
                fontSize: "0.7rem", 
                fontWeight: "700", 
                padding: "0.25rem 0.6rem", 
                borderRadius: "20px",
                background: item.status === "Connected" ? "#dcfce7" : item.status === "Configured" ? "#fef9c3" : "#f1f5f9",
                color: item.status === "Connected" ? "#166534" : item.status === "Configured" ? "#854d0e" : "#64748b"
              }}>
                {item.status}
              </span>
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>{item.name}</h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "2rem", flex: 1 }}>{item.description}</p>
            <a 
              href={item.btnUrl} 
              className="premium-btn" 
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.875rem", background: item.status === "Not Connected" ? "#3b82f6" : "white", border: "1px solid #e2e8f0", color: item.status === "Not Connected" ? "white" : "#1e293b" }}
            >
              {item.btnText}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
