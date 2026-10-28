"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

interface Lead {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  subject?: string;
  leadSource: string;
  message: string;
  status: string;
  internalNotes: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Progressive lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.contact.base);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: number) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.contact.byId(id), { status: editStatus, internalNotes: editNotes });
      if (res.ok) {
        setEditingId(null);
        fetchLeads();
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
  };

  const startEditing = (lead: Lead) => {
    setEditingId(lead.id);
    setEditStatus(lead.status || "NEW");
    setEditNotes(lead.internalNotes || "");
  };

  const visibleLeads = leads.slice(0, visibleCount);
  const hasMore = visibleCount < leads.length;

  return (
    <div>
      <div className="gridCards">
        <div className="card">
          <div className="cardHeader">
            <span>Total Leads</span>
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <div className="cardValue">{loading ? "..." : leads.length}</div>
        </div>
        <div className="card">
          <div className="cardHeader">
            <span>New Leads</span>
            <i className="fa-solid fa-bell"></i>
          </div>
          <div className="cardValue">{loading ? "..." : leads.filter(l => l.status === 'NEW').length}</div>
        </div>
      </div>

      <div className="tableContainer">
        <table className="table">
          <thead>
            <tr>
              <th>Contact Info</th>
              <th>Company / Source</th>
              <th>Message</th>
              <th>Status</th>
              <th>Internal Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Shimmer skeleton rows for lazy loading
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="skeleton" style={{ width: "120px", height: "16px", marginBottom: "6px" }}></div>
                    <div className="skeleton" style={{ width: "140px", height: "12px", marginBottom: "4px" }}></div>
                    <div className="skeleton" style={{ width: "90px", height: "12px" }}></div>
                  </td>
                  <td>
                    <div className="skeleton" style={{ width: "100px", height: "14px", marginBottom: "6px" }}></div>
                    <div className="skeleton" style={{ width: "80px", height: "12px" }}></div>
                  </td>
                  <td><div className="skeleton" style={{ width: "180px", height: "36px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "70px", height: "22px", borderRadius: "4px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "140px", height: "30px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "50px", height: "28px", borderRadius: "6px" }}></div></td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                  No CRM leads found.
                </td>
              </tr>
            ) : (
              visibleLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.fullName}</strong><br/>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{lead.email}</span><br/>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{lead.phone || "No phone"}</span>
                  </td>
                  <td>
                    {lead.subject && (
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(228,82,27,0.15)", color: "#E4521B", fontWeight: 600 }}>
                          {lead.subject}
                        </span>
                      </div>
                    )}
                    {lead.company || "-"}<br/>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Src: {lead.leadSource || "Direct"}</span>
                  </td>
                  <td style={{ maxWidth: "200px" }}>
                    <div style={{ fontSize: "0.9rem", maxHeight: "60px", overflowY: "auto", paddingRight: "5px" }}>
                      {lead.message}
                    </div>
                  </td>
                  <td>
                    {editingId === lead.id ? (
                      <select 
                        value={editStatus} 
                        onChange={(e) => setEditStatus(e.target.value)}
                        style={{ padding: "5px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)" }}
                      >
                        <option value="NEW">New</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    ) : (
                      <span className={`badge ${lead.status === 'NEW' ? 'badge-warning' : lead.status === 'CONVERTED' ? 'badge-success' : 'badge-outline'}`}>
                        {lead.status}
                      </span>
                    )}
                  </td>
                  <td style={{ minWidth: "200px" }}>
                    {editingId === lead.id ? (
                      <textarea 
                        value={editNotes} 
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes..."
                        style={{ width: "100%", padding: "5px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", minHeight: "60px", resize: "vertical" }}
                      />
                    ) : (
                      <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                        {lead.internalNotes || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notes</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === lead.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <button className="btn btn-sm" onClick={() => handleSave(lead.id)}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => startEditing(lead)}>
                        <i className="fa-solid fa-pen"></i> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Progressive lazy loading load-more footer */}
        {!loading && leads.length > ITEMS_PER_PAGE && (
          <div className="lazyLoadFooter">
            <span>
              Showing {Math.min(visibleCount, leads.length)} of {leads.length} leads
            </span>
            {hasMore ? (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              >
                <i className="fa-solid fa-angles-down" style={{ marginRight: "6px" }}></i>
                Load More Leads
              </button>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>All leads loaded</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
