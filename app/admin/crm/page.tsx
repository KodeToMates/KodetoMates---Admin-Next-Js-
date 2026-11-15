"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";
import { useConfirm } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

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
  application?: {
    id: number;
    name: string;
  };
}

type BrandFilter = "ALL" | "KODETOMATES" | "DATALIVE";

interface BrandInfo {
  brand: "KODETOMATES" | "DATALIVE" | "OTHER";
  name: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  accentColor: string;
  icon: string;
}

function getLeadBrand(lead: Lead): BrandInfo {
  const src = (lead.leadSource || "").toLowerCase();
  const appName = (lead.application?.name || "").toLowerCase();

  if (src.includes("datalive") || appName.includes("datalive")) {
    return {
      brand: "DATALIVE",
      name: "DataLive Intelligence",
      badgeBg: "rgba(14, 165, 233, 0.14)",
      badgeBorder: "rgba(14, 165, 233, 0.35)",
      badgeColor: "#38BDF8", // Cyan / Sky Blue
      accentColor: "#0EA5E9",
      icon: "fa-solid fa-database",
    };
  }

  return {
    brand: "KODETOMATES",
    name: "KodeToMates",
    badgeBg: "rgba(228, 82, 27, 0.14)",
    badgeBorder: "rgba(228, 82, 27, 0.35)",
    badgeColor: "#FF7A30", // Terracotta Orange
    accentColor: "#E4521B",
    icon: "fa-solid fa-code",
  };
}

const ITEMS_PER_PAGE = 10;

export default function CrmPage() {
  const { confirm, alert: showAlert } = useConfirm();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Progressive lazy loading state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>("ALL");

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
        const lead = leads.find((l) => l.id === id);
        const name = lead ? lead.fullName : `Lead #${id}`;
        toast.success(`CRM lead status for "${name}" updated to ${editStatus}!`, "Lead Updated");
      } else {
        toast.error("Failed to update lead status. Please try again.", "Update Failed");
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
      toast.error("An unexpected error occurred while saving changes.", "Update Error");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const isConfirmed = await confirm({
      title: "Delete CRM Lead",
      message: "Are you sure you want to permanently delete this lead? This action will permanently remove it from the database.",
      itemName: name,
      confirmText: "Yes, Delete Lead",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!isConfirmed) return;

    setDeletingId(id);
    try {
      const res = await apiClient.delete(API_ENDPOINTS.contact.byId(id));
      if (res.ok) {
        setLeads((prev) => prev.filter((lead) => lead.id !== id));
        if (editingId === id) {
          setEditingId(null);
        }
        toast.success(`CRM lead "${name}" was permanently removed.`, "Lead Deleted");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || "Failed to delete lead from server.", "Delete Failed");
      }
    } catch (err) {
      console.error("Failed to delete lead:", err);
      toast.error("Failed to delete lead.", "Delete Error");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (lead: Lead) => {
    setEditingId(lead.id);
    setEditStatus(lead.status || "NEW");
    setEditNotes(lead.internalNotes || "");
  };

  const kodeCount = leads.filter((l) => getLeadBrand(l).brand === "KODETOMATES").length;
  const dataLiveCount = leads.filter((l) => getLeadBrand(l).brand === "DATALIVE").length;

  const filteredLeads = leads.filter((l) => {
    if (selectedBrand === "ALL") return true;
    return getLeadBrand(l).brand === selectedBrand;
  });

  const visibleLeads = filteredLeads.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLeads.length;

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
            <span style={{ color: "#FF7A30" }}>KodeToMates</span>
            <i className="fa-solid fa-code" style={{ color: "#E4521B" }}></i>
          </div>
          <div className="cardValue" style={{ color: "#FF7A30" }}>{loading ? "..." : kodeCount}</div>
        </div>
        <div className="card">
          <div className="cardHeader">
            <span style={{ color: "#38BDF8" }}>DataLive Intelligence</span>
            <i className="fa-solid fa-database" style={{ color: "#0EA5E9" }}></i>
          </div>
          <div className="cardValue" style={{ color: "#38BDF8" }}>{loading ? "..." : dataLiveCount}</div>
        </div>
        <div className="card">
          <div className="cardHeader">
            <span>New Leads</span>
            <i className="fa-solid fa-bell"></i>
          </div>
          <div className="cardValue">{loading ? "..." : leads.filter(l => l.status === 'NEW').length}</div>
        </div>
      </div>

      {/* Brand Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => { setSelectedBrand("ALL"); setVisibleCount(ITEMS_PER_PAGE); }}
          style={{
            background: selectedBrand === "ALL" ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.04)",
            border: selectedBrand === "ALL" ? "1px solid var(--border-color)" : "1px solid rgba(255, 255, 255, 0.1)",
            color: selectedBrand === "ALL" ? "#ffffff" : "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "9999px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
            transition: "all 0.2s ease",
          }}
        >
          <span>All Leads</span>
          <span style={{ fontSize: "0.75rem", padding: "1px 7px", borderRadius: "10px", background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            {leads.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedBrand("KODETOMATES"); setVisibleCount(ITEMS_PER_PAGE); }}
          style={{
            background: selectedBrand === "KODETOMATES" ? "rgba(228, 82, 27, 0.22)" : "rgba(228, 82, 27, 0.06)",
            border: selectedBrand === "KODETOMATES" ? "1px solid #E4521B" : "1px solid rgba(228, 82, 27, 0.25)",
            color: "#FF7A30",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "9999px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#E4521B", display: "inline-block" }}></span>
          <span>KodeToMates</span>
          <span style={{ fontSize: "0.75rem", padding: "1px 7px", borderRadius: "10px", background: "rgba(228, 82, 27, 0.25)", color: "#FF914D" }}>
            {kodeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedBrand("DATALIVE"); setVisibleCount(ITEMS_PER_PAGE); }}
          style={{
            background: selectedBrand === "DATALIVE" ? "rgba(14, 165, 233, 0.22)" : "rgba(14, 165, 233, 0.06)",
            border: selectedBrand === "DATALIVE" ? "1px solid #0EA5E9" : "1px solid rgba(14, 165, 233, 0.25)",
            color: "#38BDF8",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "9999px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0EA5E9", display: "inline-block" }}></span>
          <span>DataLive Intelligence</span>
          <span style={{ fontSize: "0.75rem", padding: "1px 7px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.25)", color: "#7DD3FC" }}>
            {dataLiveCount}
          </span>
        </button>
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
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                  {selectedBrand === "KODETOMATES"
                    ? "No KodeToMates leads found."
                    : selectedBrand === "DATALIVE"
                    ? "No DataLive Intelligence leads found."
                    : "No CRM leads found."}
                </td>
              </tr>
            ) : (
              visibleLeads.map((lead) => {
                const brand = getLeadBrand(lead);

                return (
                  <tr key={lead.id} style={{ borderLeft: `4px solid ${brand.accentColor}` }}>
                    <td>
                      <strong>{lead.fullName}</strong><br/>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{lead.email}</span><br/>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{lead.phone || "No phone"}</span>
                    </td>
                    <td>
                      {/* Brand Origin Pill Badge */}
                      <div style={{ marginBottom: "6px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.72rem",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: brand.badgeBg,
                            border: `1px solid ${brand.badgeBorder}`,
                            color: brand.badgeColor,
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                          }}
                        >
                          <i className={brand.icon} style={{ fontSize: "0.68rem" }}></i>
                          <span>{brand.name}</span>
                        </span>
                      </div>

                      {/* Subject tag */}
                      {lead.subject && (
                        <div style={{ marginBottom: "4px" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: brand.brand === "DATALIVE" ? "rgba(14, 165, 233, 0.15)" : "rgba(228,82,27,0.15)",
                              color: brand.brand === "DATALIVE" ? "#38BDF8" : "#E4521B",
                              fontWeight: 600,
                            }}
                          >
                            {lead.subject}
                          </span>
                        </div>
                      )}

                      {/* Company Name */}
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                        {lead.company || "-"}
                      </div>

                      {/* Source detail */}
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Src: {lead.leadSource || "Direct"}
                      </span>
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
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--input-bg)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--text-main)", outline: "none" }}
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
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--input-bg)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "var(--text-main)", minHeight: "65px", resize: "vertical", outline: "none", fontSize: "0.9rem" }}
                      />
                    ) : (
                      <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                        {lead.internalNotes || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notes</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === lead.id ? (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button className="btn btn-sm" onClick={() => handleSave(lead.id)} title="Save Changes">
                          <i className="fa-solid fa-check"></i> Save
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)} title="Cancel">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => startEditing(lead)} title="Edit Status & Notes">
                          <i className="fa-solid fa-pen"></i> Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDelete(lead.id, lead.fullName)}
                          disabled={deletingId === lead.id}
                          style={{
                            color: "#f87171",
                            borderColor: "rgba(239, 68, 68, 0.35)",
                            background: "rgba(239, 68, 68, 0.08)",
                          }}
                          title="Delete Lead"
                        >
                          <i className={`fa-solid ${deletingId === lead.id ? "fa-circle-notch fa-spin" : "fa-trash"}`}></i>
                          {deletingId === lead.id ? " Deleting..." : " Delete"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
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
