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

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState("");

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

  return (
    <div>
      <div className="gridCards">
        <div className="card">
          <div className="cardHeader">
            <span>Total Apps</span>
            <i className="fa-solid fa-cube"></i>
          </div>
          <div className="cardValue">{apps.length}</div>
          <div style={{ color: "#34d399", fontSize: "0.9rem" }}>
            <i className="fa-solid fa-arrow-trend-up"></i> Active tracking
          </div>
        </div>
      </div>

      <div className="tableContainer">
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>Loading applications...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>App Name</th>
                <th>Domain</th>
                <th>To Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(app => (
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
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>No applications found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
