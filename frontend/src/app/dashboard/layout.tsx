"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    { name: "New Job", path: "/dashboard/jobs/new", icon: "➕" },
    { name: "Generated Jobs", path: "/dashboard/generated", icon: "✨" },
    { name: "Applications", path: "/dashboard/applications", icon: "👥" },
    { name: "Integrations", path: "/dashboard/integrations", icon: "🔗" },
  ];

  return (
    <div className={styles.layoutContainer}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.backLink}>
           <span>←</span> Back to Website
        </Link>
        
        <div className={styles.logo}>
          <div className={styles.logoIcon}>✨</div>
          Evalyn
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${
                pathname === item.path ? styles.navItemActive : ""
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className={styles.userProfile}>
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user.username}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span style={{ fontSize: "1rem" }}>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.contentArea}>{children}</main>
    </div>
  );
}
