"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import Image from "next/image";

const NAV_ITEMS = [
  { id: "applications", label: "Applications", icon: "fa-cubes", path: "/admin/applications" },
  { id: "crm", label: "CRM Leads", icon: "fa-users", path: "/admin/crm" },
  { id: "templates", label: "Email Templates", icon: "fa-envelope-open-text", path: "/admin/templates" },
  { id: "iam", label: "Identity & Access", icon: "fa-shield-halved", path: "/admin/iam" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <img src="/KM - Logo.png" alt="Kodetomates Logo" />
        Admin Portal
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <Link
            key={item.id}
            href={item.path}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
          >
            <i className={`fa-solid ${item.icon}`}></i> {item.label}
          </Link>
        );
      })}

      <div className={styles.spacer}></div>

      <Link href="/login" className={`${styles.navItem} ${styles.logout}`}>
        <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
      </Link>
    </div>
  );
}
