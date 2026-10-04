import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import TopHeader from "../../components/TopHeader/TopHeader";
import styles from "./layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dashboardScreen}>
      <Sidebar />
      <div className={styles.mainContent}>
        <TopHeader />
        {/* Child pages (Applications, CRM, Templates, IAM) will render here */}
        {children}
      </div>
    </div>
  );
}
