"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import styles from "./Sidebar.module.css";
import { useSidebar } from "./SidebarContext";
import { useTheme } from "../Theme/ThemeContext";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

const NAV_ITEMS = [
  { id: "applications", label: "Core Tenants", icon: "fa-cubes", path: "/admin/applications" },
  { id: "crm", label: "Tenant Leads", icon: "fa-users", path: "/admin/crm" },
  { id: "templates", label: "Email Templates", icon: "fa-envelope-open-text", path: "/admin/templates" },
  { id: "iam", label: "Users", icon: "fa-shield-halved", path: "/admin/iam" },
  { id: "profile", label: "User Settings", icon: "fa-user-gear", path: "/admin/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState("");
  const [avatarChar, setAvatarChar] = useState("A");

  const isSuperAdmin = (role: string) => {
    const norm = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    return norm === "superadmin";
  };

  useEffect(() => {
    const syncProfileFromStorage = () => {
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
    };

    syncProfileFromStorage();
    window.addEventListener("storage", syncProfileFromStorage);

    // Sync latest profile from /api/v1/auth/me
    const token = localStorage.getItem("token");
    if (token) {
      apiClient.get(API_ENDPOINTS.auth.me)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            const fullName = ((data.firstName || "") + (data.lastName ? " " + data.lastName : "")).trim();
            const nameToUse = fullName || data.email || "Admin User";
            const rawRole = (data.accessProfiles && data.accessProfiles.length > 0)
              ? data.accessProfiles[0]
              : "SUPERADMIN";
            const roleToUse = rawRole === "SUPERADMIN" ? "Super Admin" : rawRole;

            setUserName(nameToUse);
            setUserRole(roleToUse);
            setAvatarChar(nameToUse.charAt(0).toUpperCase());

            localStorage.setItem("userName", nameToUse);
            localStorage.setItem("userRole", roleToUse);
          }
        })
        .catch(() => { });
    }

    return () => {
      window.removeEventListener("storage", syncProfileFromStorage);
    };
  }, []);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}>
      <div className={styles.brand}>
        <div className={styles.brandLogoWrap}>
          <Image
            src="/Image_v1/Primary-Logo.png"
            alt="KodeToMates Logo"
            width={32}
            height={32}
            priority
            style={{ height: "32px", width: "auto", objectFit: "contain" }}
          />
          {!isCollapsed && <span className={styles.brandText}>Admin Portal</span>}
        </div>
        <button
          type="button"
          className={styles.collapseToggleBtn}
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`fa-solid ${isCollapsed ? "fa-angles-right" : "fa-angles-left"}`}></i>
        </button>
      </div>

      <nav style={{ display: "flex", flexDirection: "column" }}>
        {NAV_ITEMS.filter((item) => {
          if (item.id === "iam") {
            return isSuperAdmin(userRole);
          }
          return true;
        }).map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={styles.spacer}></div>

      <div className={styles.footerSection}>
        {/* Theme Toggle (Light / Dark mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          className={styles.themeToggleBtn}
          title={isCollapsed ? `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode` : undefined}
          aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          <div className={styles.themeIconWrap}>
            <i className={`fa-solid ${theme === "dark" ? "fa-moon" : "fa-sun"}`}></i>
          </div>
          {!isCollapsed && (
            <>
              <span className={styles.themeLabel}>
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
              <div className={`${styles.themeSwitchTrack} ${theme === "light" ? styles.themeSwitchTrackLight : ""}`}>
                <div className={styles.themeSwitchThumb}></div>
              </div>
            </>
          )}
        </button>

        {/* User Profile Card - positioned top of the logout button */}
        <Link
          href="/admin/profile"
          className={`${styles.userProfile} ${pathname.startsWith("/admin/profile") ? styles.userProfileActive : ""}`}
          title={isCollapsed ? `${userName} (${userRole})` : "View User Settings & Profile"}
        >
          <div className={styles.avatar}>{avatarChar}</div>
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userRole}>{userRole}</div>
            </div>
          )}
        </Link>

        {/* Logout Button */}
        <Link
          href="/login"
          onClick={() => {
            localStorage.removeItem("token");
          }}
          className={`${styles.navItem} ${styles.logout}`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          {!isCollapsed && <span className={styles.navLabel}>Logout</span>}
        </Link>
      </div>
    </aside>
  );
}
