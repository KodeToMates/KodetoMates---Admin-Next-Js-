"use client";

import { usePathname } from "next/navigation";
import styles from "./TopHeader.module.css";

const ROUTE_TITLES: Record<string, string> = {
  "/admin/applications": "Applications Overview",
  "/admin/crm": "CRM Leads Management",
  "/admin/templates": "Email Templates",
  "/admin/iam": "Identity & Entitlements",
};

export default function TopHeader() {
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname] || "Admin Dashboard";

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.userProfile}>
        <div className={styles.userInfo}>
          <div className={styles.userName}>Admin User</div>
          <div className={styles.userRole}>Superadmin</div>
        </div>
        <div className={styles.avatar}>A</div>
      </div>
    </div>
  );
}
