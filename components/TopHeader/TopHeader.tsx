"use client";

import { usePathname } from "next/navigation";
import styles from "./TopHeader.module.css";
import { useSidebar } from "../Sidebar/SidebarContext";

const ROUTE_TITLES: Record<string, string> = {
  "/admin/applications": "Core Tenants Overview",
  "/admin/crm": "CRM Leads Management",
  "/admin/templates": "Email Templates",
  "/admin/iam": "Identity & Entitlements",
  "/admin/profile": "User Settings & Security",
};

export default function TopHeader() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const title = ROUTE_TITLES[pathname] || "Admin Dashboard";

  return (
    <div className={styles.header}>
      <div className={styles.titleWrap}>
        <button
          type="button"
          className={styles.menuToggleBtn}
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`fa-solid ${isCollapsed ? "fa-bars-staggered" : "fa-bars"}`}></i>
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
    </div>
  );
}
