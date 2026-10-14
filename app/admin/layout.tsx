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
        <Sidebar />
        <div className={styles.mainContent}>
          <TopHeader />
          {/* Child pages (Applications, CRM, Templates, IAM, Profile) will render here */}
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
