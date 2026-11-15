"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";
import { useConfirm } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

export interface SeoAuditLead {
  id: number;
  fullName: string;
  email: string;
  websiteUrl: string;
  primaryGoal?: string;
  monthlyTraffic?: string;
  notes?: string;
  status: string;
  createdAt: string;
  application?: {
    id: number;
    name: string;
  };
}

const ITEMS_PER_PAGE = 10;

type StatusFilter = "ALL" | "NEW" | "IN_REVIEW" | "AUDIT_SENT" | "COMPLETED" | "CLOSED";

export default function SeoAuditsPage() {
  const { confirm, alert: showAlert } = useConfirm();
  const { toast } = useToast();
  const [audits, setAudits] = useState<SeoAuditLead[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(API_ENDPOINTS.seoAudit.base);
      if (res.ok) {
        const data = await res.json();
        setAudits(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch SEO audits:", res.status);
      }
    } catch (err) {
      console.error("Error fetching SEO audits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleStartEdit = (audit: SeoAuditLead) => {
    setEditingId(audit.id);
    setEditStatus(audit.status || "NEW");
    setEditNotes(audit.notes || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatus("");
    setEditNotes("");
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.seoAudit.byId(id), {
        status: editStatus,
        notes: editNotes,
      });

      if (res.ok) {
        const updated = await res.json();
        setAudits((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
        setEditingId(null);
        const currentAudit = audits.find((item) => item.id === id);
        const leadName = currentAudit ? currentAudit.fullName : `Lead #${id}`;
        toast.success(`Audit status for "${leadName}" successfully updated to ${editStatus}!`, "Status Updated");
      } else {
        toast.error("Failed to update audit status. Please try again.", "Update Failed");
      }
    } catch (err) {
      console.error("Error updating SEO audit:", err);
      toast.error("An unexpected error occurred while saving changes.", "Update Error");
    }
  };

  const handleDelete = async (id: number, leadName: string) => {
    const isConfirmed = await confirm({
      title: "Delete SEO Audit Lead?",
      message: "Are you sure you want to permanently delete this SEO audit request? This action cannot be undone.",
      itemName: leadName,
      confirmText: "Yes, Delete Lead",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!isConfirmed) return;

    try {
      setDeletingId(id);
      const res = await apiClient.delete(API_ENDPOINTS.seoAudit.byId(id));
      if (res.ok) {
        setAudits((prev) => prev.filter((item) => item.id !== id));
        toast.success(`SEO audit lead "${leadName}" was permanently deleted.`, "Lead Deleted");
      } else {
        toast.error("Could not delete this audit record. Please check server logs.", "Delete Failed");
      }
    } catch (err) {
      console.error("Error deleting audit:", err);
      toast.error("Failed to delete record.", "Delete Error");
    } finally {
      setDeletingId(null);
    }
  };

  // Metrics
  const totalCount = audits.length;
  const newCount = audits.filter((a) => (a.status || "").toUpperCase() === "NEW").length;
  const inReviewCount = audits.filter((a) => (a.status || "").toUpperCase() === "IN_REVIEW").length;
  const completedCount = audits.filter((a) => ["AUDIT_SENT", "COMPLETED"].includes((a.status || "").toUpperCase())).length;

  // Filtered audits
  const filteredAudits = audits.filter((audit) => {
    if (selectedStatus !== "ALL") {
      const s = (audit.status || "").toUpperCase();
      if (s !== selectedStatus) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (audit.fullName || "").toLowerCase().includes(q);
      const matchEmail = (audit.email || "").toLowerCase().includes(q);
      const matchUrl = (audit.websiteUrl || "").toLowerCase().includes(q);
      const matchGoal = (audit.primaryGoal || "").toLowerCase().includes(q);
      const matchNotes = (audit.notes || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchUrl || matchGoal || matchNotes;
    }

    return true;
  });

  const visibleAudits = filteredAudits.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAudits.length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const cleanUrl = (url: string) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || "NEW").toUpperCase();
    switch (s) {
      case "NEW":
        return {
          bg: "rgba(59, 130, 246, 0.15)",
          color: "#60A5FA",
          border: "rgba(59, 130, 246, 0.35)",
          label: "New",
        };
      case "IN_REVIEW":
        return {
          bg: "rgba(234, 179, 8, 0.15)",
          color: "#FACC15",
          border: "rgba(234, 179, 8, 0.35)",
          label: "In Review",
        };
      case "AUDIT_SENT":
        return {
          bg: "rgba(168, 85, 247, 0.15)",
          color: "#C084FC",
          border: "rgba(168, 85, 247, 0.35)",
          label: "Audit Sent",
        };
      case "COMPLETED":
        return {
          bg: "rgba(34, 197, 94, 0.15)",
          color: "#4ADE80",
          border: "rgba(34, 197, 94, 0.35)",
          label: "Completed",
        };
      case "CLOSED":
        return {
          bg: "rgba(107, 114, 128, 0.15)",
          color: "#9CA3AF",
          border: "rgba(107, 114, 128, 0.35)",
          label: "Closed",
        };
      default:
        return {
          bg: "rgba(228, 82, 27, 0.15)",
          color: "#FF7A30",
          border: "rgba(228, 82, 27, 0.35)",
          label: statusStr,
        };
    }
  };

  return (
    <div>
      {/* Metrics Row */}
      <div className="gridCards">
        <div className="card">
          <div className="cardHeader">
            <span>Total SEO Audits</span>
            <i className="fa-solid fa-magnifying-glass-chart" style={{ color: "#E4521B" }}></i>
          </div>
          <div className="cardValue">{loading ? "..." : totalCount}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <i className="fa-solid fa-globe" style={{ marginRight: "6px" }}></i>
            kodetomates.in/what-we-do/seo
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <span style={{ color: "#60A5FA" }}>New Requests</span>
            <i className="fa-solid fa-bell" style={{ color: "#3B82F6" }}></i>
          </div>
          <div className="cardValue" style={{ color: "#60A5FA" }}>{loading ? "..." : newCount}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Awaiting initial review</div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <span style={{ color: "#FACC15" }}>In Review</span>
            <i className="fa-solid fa-spinner" style={{ color: "#EAB308" }}></i>
          </div>
          <div className="cardValue" style={{ color: "#FACC15" }}>{loading ? "..." : inReviewCount}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Technical audit in progress</div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <span style={{ color: "#4ADE80" }}>Completed / Sent</span>
            <i className="fa-solid fa-circle-check" style={{ color: "#22C55E" }}></i>
          </div>
          <div className="cardValue" style={{ color: "#4ADE80" }}>{loading ? "..." : completedCount}</div>
          <div style={{ color: "#34d399", fontSize: "0.85rem" }}>Delivered to lead</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { key: "ALL" as const, label: "All Audits", count: totalCount },
            { key: "NEW" as const, label: "New", count: newCount },
            { key: "IN_REVIEW" as const, label: "In Review", count: inReviewCount },
            { key: "AUDIT_SENT" as const, label: "Audit Sent", count: audits.filter((a) => (a.status || "").toUpperCase() === "AUDIT_SENT").length },
            { key: "COMPLETED" as const, label: "Completed", count: audits.filter((a) => (a.status || "").toUpperCase() === "COMPLETED").length },
          ].map((tab) => {
            const isSelected = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                style={{
                  background: isSelected ? "rgba(228, 82, 27, 0.22)" : "rgba(255, 255, 255, 0.04)",
                  border: isSelected ? "1px solid #E4521B" : "1px solid rgba(255, 255, 255, 0.1)",
                  color: isSelected ? "#FF7A30" : "var(--text-muted)",
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
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "1px 7px",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(228, 82, 27, 0.35)" : "rgba(255, 255, 255, 0.12)",
                    color: isSelected ? "#ffffff" : "var(--text-main)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Refresh */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              placeholder="Search by name, email, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: "var(--text-main)",
                outline: "none",
                fontSize: "0.85rem",
              }}
            />
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            />
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchAudits}
            disabled={loading}
            title="Refresh Leads"
          >
            <i className={`fa-solid fa-rotate ${loading ? "fa-spin" : ""}`}></i>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="tableContainer">
        <table className="table">
          <thead>
            <tr>
              <th>Lead Info</th>
              <th>Target Domain</th>
              <th>Goal & Traffic</th>
              <th>Notes / Context</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="skeleton" style={{ width: "120px", height: "16px", marginBottom: "6px" }}></div>
                    <div className="skeleton" style={{ width: "150px", height: "12px", marginBottom: "4px" }}></div>
                    <div className="skeleton" style={{ width: "90px", height: "12px" }}></div>
                  </td>
                  <td><div className="skeleton" style={{ width: "160px", height: "16px" }}></div></td>
                  <td>
                    <div className="skeleton" style={{ width: "140px", height: "14px", marginBottom: "4px" }}></div>
                    <div className="skeleton" style={{ width: "80px", height: "18px", borderRadius: "4px" }}></div>
                  </td>
                  <td><div className="skeleton" style={{ width: "180px", height: "14px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "75px", height: "22px", borderRadius: "10px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "110px", height: "28px", borderRadius: "6px" }}></div></td>
                </tr>
              ))
            ) : filteredAudits.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-folder-open" style={{ fontSize: "2rem", marginBottom: "10px", display: "block", color: "var(--text-subtle)" }}></i>
                  No SEO audit requests found matching your filters.
                </td>
              </tr>
            ) : (
              visibleAudits.map((audit) => {
                const isEditing = editingId === audit.id;
                const statusBadge = getStatusBadge(audit.status);

                return (
                  <tr
                    key={audit.id}
                    style={{
                      borderLeft: "4px solid #E4521B",
                    }}
                  >
                    {/* Lead Info */}
                    <td style={{ minWidth: "180px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.95rem" }}>
                        {audit.fullName}
                      </div>
                      <div style={{ marginTop: "3px" }}>
                        <a
                          href={`mailto:${audit.email}`}
                          style={{
                            color: "#FF7A30",
                            fontSize: "0.82rem",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <i className="fa-regular fa-envelope" style={{ fontSize: "0.75rem" }}></i>
                          {audit.email}
                        </a>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        <i className="fa-regular fa-clock" style={{ marginRight: "4px" }}></i>
                        {formatDate(audit.createdAt)}
                      </div>
                    </td>

                    {/* Target Domain */}
                    <td style={{ minWidth: "180px" }}>
                      <a
                        href={cleanUrl(audit.websiteUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "var(--text-main)",
                          background: "rgba(255, 255, 255, 0.05)",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <i className="fa-solid fa-globe" style={{ color: "#FF7A30", fontSize: "0.8rem" }}></i>
                        <span>{audit.websiteUrl}</span>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}></i>
                      </a>
                    </td>

                    {/* Goal & Traffic */}
                    <td style={{ minWidth: "180px" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-main)" }}>
                        {audit.primaryGoal || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Not specified</span>}
                      </div>
                      {audit.monthlyTraffic && (
                        <div style={{ marginTop: "5px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              color: "var(--text-muted)",
                            }}
                          >
                            <i className="fa-solid fa-chart-simple" style={{ fontSize: "0.7rem" }}></i>
                            {audit.monthlyTraffic}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Notes / Message */}
                    <td style={{ minWidth: "200px", maxWidth: "260px" }}>
                      {isEditing ? (
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add internal notes or customer observations..."
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            background: "var(--input-bg)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            color: "var(--text-main)",
                            minHeight: "65px",
                            resize: "vertical",
                            outline: "none",
                            fontSize: "0.85rem",
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: "0.85rem", maxHeight: "65px", overflowY: "auto", paddingRight: "4px", whiteSpace: "pre-wrap" }}>
                          {audit.notes || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notes provided</span>}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ minWidth: "130px" }}>
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            background: "var(--input-bg)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "0.85rem",
                          }}
                        >
                          <option value="NEW">New</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="AUDIT_SENT">Audit Sent</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`,
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: statusBadge.color,
                              display: "inline-block",
                            }}
                          ></span>
                          {statusBadge.label}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ minWidth: "150px" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleSaveEdit(audit.id)}
                            title="Save Changes"
                          >
                            <i className="fa-solid fa-check"></i> Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleCancelEdit}
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleStartEdit(audit)}
                            title="Edit Status & Notes"
                          >
                            <i className="fa-solid fa-pen"></i> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleDelete(audit.id, audit.fullName)}
                            disabled={deletingId === audit.id}
                            style={{
                              color: "#f87171",
                              borderColor: "rgba(239, 68, 68, 0.35)",
                              background: "rgba(239, 68, 68, 0.08)",
                            }}
                            title="Delete Lead"
                          >
                            <i
                              className={`fa-solid ${
                                deletingId === audit.id ? "fa-circle-notch fa-spin" : "fa-trash"
                              }`}
                            ></i>
                            {deletingId === audit.id ? " Deleting..." : " Delete"}
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
        {!loading && filteredAudits.length > ITEMS_PER_PAGE && (
          <div className="lazyLoadFooter">
            <span>
              Showing {Math.min(visibleCount, filteredAudits.length)} of {filteredAudits.length} audits
            </span>
            {hasMore ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              >
                <i className="fa-solid fa-angles-down" style={{ marginRight: "6px" }}></i>
                Load More Audits
              </button>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>All audits loaded</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
