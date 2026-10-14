"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

interface Application {
  id: number;
  name: string;
  description: string;
  domainUrl: string;
  fromEmail: string;
  toEmail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState("");

  // Progressive lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.application.base);
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async (id: number) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.application.byId(id), { toEmail: editEmail });
      if (res.ok) {
        setEditingId(null);
        fetchApps();
      }
    } catch (err) {
      console.error("Failed to update to_email:", err);
    }
  };

  const startEditing = (app: Application) => {
    setEditingId(app.id);
    setEditEmail(app.toEmail || "");
  };

  const visibleApps = apps.slice(0, visibleCount);
  const hasMore = visibleCount < apps.length;

  return (
    <div>
      <div className="gridCards">
        <div className="card">
          <div className="cardHeader">
            <span>Total Tenants</span>
            <i className="fa-solid fa-cube"></i>
          </div>
          <div className="cardValue">{loading ? "..." : apps.length}</div>
          <div style={{ color: "#34d399", fontSize: "0.9rem" }}>
            <i className="fa-solid fa-arrow-trend-up"></i> Active tracking
          </div>
        </div>
      </div>

      <div className="tableContainer">
        <table className="table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Domain</th>
              <th>To Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Shimmer skeleton rows for lazy loading
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "4px" }}></div>
                      <div className="skeleton" style={{ width: "120px", height: "16px" }}></div>
                    </div>
                  </td>
                  <td><div className="skeleton" style={{ width: "140px", height: "14px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "150px", height: "14px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "65px", height: "20px", borderRadius: "4px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "75px", height: "28px", borderRadius: "6px" }}></div></td>
                </tr>
              ))
            ) : apps.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  No core tenants found in database.
                </td>
              </tr>
            ) : (
              visibleApps.map((app) => (
                <tr key={app.id}>
                  <td>
                    <i className="fa-solid fa-window-restore" style={{ color: "var(--primary)", marginRight: "10px" }}></i> 
                    {app.name}
                  </td>
                  <td>{app.domainUrl || "-"}</td>
                  <td>
                    {editingId === app.id ? (
                      <input 
                        type="email" 
                        value={editEmail} 
                        onChange={(e) => setEditEmail(e.target.value)} 
                        style={{ padding: "5px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-main)" }}
                      />
                    ) : (
                      app.toEmail || "-"
                    )}
                  </td>
                  <td>
                    <span className={`badge ${app.isActive ? 'badge-success' : 'badge-warning'}`}>
                      {app.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {editingId === app.id ? (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn btn-sm" onClick={() => handleSaveEmail(app.id)}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => startEditing(app)}>
                        <i className="fa-solid fa-pen"></i> Edit Email
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Progressive lazy loading load-more footer */}
        {!loading && apps.length > ITEMS_PER_PAGE && (
          <div className="lazyLoadFooter">
            <span>
              Showing {Math.min(visibleCount, apps.length)} of {apps.length} applications
            </span>
            {hasMore ? (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              >
                <i className="fa-solid fa-angles-down" style={{ marginRight: "6px" }}></i>
                Load More Applications
              </button>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>All applications loaded</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
