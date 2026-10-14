"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";
import type { EmailTemplate } from "./TemplateEditorModal";

// Dynamically lazy-load the heavy Template Editor & Live Preview modal
const TemplateEditorModal = dynamic(() => import("./TemplateEditorModal"), {
  ssr: false,
  loading: () => (
    <div className="modalOverlay">
      <div
        className="modalContent"
        style={{
          width: "95vw",
          height: "90vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "10px", color: "var(--primary)" }}></i>
          Loading Template Editor...
        </div>
      </div>
    </div>
  ),
});

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.template.base);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (template: EmailTemplate) => {
    setIsCreating(false);
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const openCreator = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "var(--text-main)", margin: 0 }}>Email Templates</h2>
        <button className="btn" style={{ width: "auto" }} onClick={openCreator}>
          <i className="fa-solid fa-plus"></i> Create New Template
        </button>
      </div>

      {loading ? (
        // Skeleton cards for smooth lazy loading feedback
        <div className="gridCards">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="templateCard skeletonCard" key={i}>
              <div className="skeleton" style={{ width: "50%", height: "20px", marginBottom: "15px" }}></div>
              <div className="skeleton" style={{ width: "80%", height: "14px", marginBottom: "10px" }}></div>
              <div className="skeleton" style={{ width: "60%", height: "14px", marginBottom: "25px" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "15px", borderTop: "1px solid var(--border-color)" }}>
                <div className="skeleton" style={{ width: "60px", height: "22px", borderRadius: "4px" }}></div>
                <div className="skeleton" style={{ width: "50px", height: "30px", borderRadius: "6px" }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="gridCards">
          {templates.map((template) => (
            <div className="templateCard" key={template.id}>
              <div className="cardHeader">
                <h3>{template.templateCode}</h3>
              </div>
              <p className="cardDesc" style={{ marginBottom: "5px" }}>
                <strong>Subject:</strong> {template.subject}
              </p>
              <div className="cardFooter" style={{ marginTop: "15px" }}>
                <span className={`badge ${template.isActive ? "badge-success" : "badge-outline"}`}>
                  {template.isActive ? "Active" : "Inactive"}
                </span>
                <div className="btnGroup">
                  <button className="btn btn-sm" onClick={() => openEditor(template)}>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              No templates found in database.
            </div>
          )}
        </div>
      )}

      {/* Lazy-loaded Dynamic Modal */}
      {isModalOpen && (
        <TemplateEditorModal
          isOpen={isModalOpen}
          isCreating={isCreating}
          editingTemplate={editingTemplate}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchTemplates}
        />
      )}
    </div>
  );
}
