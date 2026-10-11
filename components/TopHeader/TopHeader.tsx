"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./TopHeader.module.css";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

const ROUTE_TITLES: Record<string, string> = {
  "/admin/applications": "Applications Overview",
  "/admin/crm": "CRM Leads Management",
  "/admin/templates": "Email Templates",
  "/admin/iam": "Identity & Entitlements",
};

export default function TopHeader() {
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname] || "Admin Dashboard";

  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState("Superadmin");
  const [avatarChar, setAvatarChar] = useState("A");

  useEffect(() => {
    // 1. Instantly load from localStorage if available
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole");
    const storedEmail = localStorage.getItem("email");

    if (storedName) {
      setUserName(storedName);
      setAvatarChar(storedName.charAt(0).toUpperCase());
    } else if (storedEmail) {
      const emailName = storedEmail.split("@")[0];
      setUserName(emailName);
      setAvatarChar(emailName.charAt(0).toUpperCase());
    }

    if (storedRole) {
      setUserRole(storedRole);
    }

    // 2. Sync latest profile from /api/v1/auth/me
    const token = localStorage.getItem("token");
    if (token) {
      apiClient.get(API_ENDPOINTS.auth.login.replace("/login", "/me"))
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            const fullName = ((data.firstName || "") + (data.lastName ? " " + data.lastName : "")).trim();
            const nameToUse = fullName || data.email || "Admin User";
            const roleToUse = (data.accessProfiles && data.accessProfiles.length > 0)
              ? data.accessProfiles[0]
              : "SUPERADMIN";

            setUserName(nameToUse);
            setUserRole(roleToUse);
            setAvatarChar(nameToUse.charAt(0).toUpperCase());

            localStorage.setItem("userName", nameToUse);
            localStorage.setItem("userRole", roleToUse);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.userProfile}>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{userName}</div>
          <div className={styles.userRole}>{userRole}</div>
        </div>
        <div className={styles.avatar}>{avatarChar}</div>
      </div>
    </div>
  );
}
