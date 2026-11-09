import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import TopHeader from "../../components/TopHeader/TopHeader";
import { SidebarProvider } from "../../components/Sidebar/SidebarContext";
import styles from "./layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className={styles.dashboardScreen}>
        {/* Ambient Glassmorphic Aurora Glow Backdrops */}
        <div className={styles.ambientGlowContainer} aria-hidden="true">
          <div className={styles.glowOrb1} />
          <div className={styles.glowOrb2} />
          <div className={styles.glowOrb3} />
        </div>

        <Sidebar />
        <main className={styles.mainContent}>
          <TopHeader />
          {/* Child pages (Applications, CRM, Templates, IAM, Profile) render here */}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
