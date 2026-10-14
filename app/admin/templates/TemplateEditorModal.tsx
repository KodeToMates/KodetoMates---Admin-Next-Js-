"use client";

import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

export interface EmailTemplate {
  id: number;
  templateCode: string;
  subject: string;
  templateData: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateEditorModalProps {
  isOpen: boolean;
  isCreating: boolean;
  editingTemplate: EmailTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TemplateEditorModal({
  isOpen,
  isCreating,
  editingTemplate,
  onClose,
  onSuccess,
}: TemplateEditorModalProps) {
  const [editTemplateCode, setEditTemplateCode] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editJson, setEditJson] = useState("{}");
  const [editHtml, setEditHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState(false);

  const updatePreview = (htmlString: string, jsonString: string) => {
    try {
      let finalHtml = htmlString;
      const vars = JSON.parse(jsonString || "{}");
      Object.keys(vars).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        finalHtml = finalHtml.replace(regex, vars[key]);
      });
      setPreviewHtml(finalHtml);
    } catch {
      setPreviewHtml(htmlString);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (isCreating) {
      setEditTemplateCode("");
      setEditSubject("");
      setEditJson("{}");
      setEditHtml("");
      setPreviewHtml("");
    } else if (editingTemplate) {
      setEditTemplateCode(editingTemplate.templateCode || "");
      setEditSubject(editingTemplate.subject || "");
      const tData = editingTemplate.templateData || {};
      const jsonStr = JSON.stringify(tData.variables || {}, null, 2);
      const htmlStr = tData.html || "";
      setEditJson(jsonStr);
      setEditHtml(htmlStr);
      updatePreview(htmlStr, jsonStr);
    }
  }, [isOpen, isCreating, editingTemplate]);

  if (!isOpen) return null;

  const handleHtmlChange = (val: string) => {
    setEditHtml(val);
    updatePreview(val, editJson);
  };

  const handleJsonChange = (val: string) => {
    setEditJson(val);
    updatePreview(editHtml, val);
  };

  const handleSave = async () => {
    if (!isCreating && !editingTemplate) return;
    try {
      let parsedVariables = {};
      try {
        parsedVariables = JSON.parse(editJson);
      } catch {
        alert("Invalid JSON format for variables.");
        return;
      }

      setSaving(true);
      const payload = {
        templateCode: editTemplateCode,
        subject: editSubject,
        templateData: {
          html: editHtml,
          variables: parsedVariables,
        },
      };

      let res;
      if (isCreating) {
        res = await apiClient.post(API_ENDPOINTS.template.base, payload);
      } else {
        res = await apiClient.put(API_ENDPOINTS.template.byId(editingTemplate!.id), payload);
      }

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to save template.");
      }
    } catch (err) {
      console.error("Failed to update template:", err);
      alert("Error saving template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modalContent" style={{ width: "95vw", height: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="modalHeader" style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-main)" }}>
              {isCreating ? "Create New Template" : `Editing: ${editingTemplate?.templateCode}`}
            </h2>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="modalBody" style={{ flexGrow: 1, display: "flex", gap: "20px", padding: "20px" }}>
          <div className="editorPanel" style={{ flex: 0.4, display: "flex", flexDirection: "column" }}>
            {isCreating && (
              <>
                <label style={{ color: "var(--text-muted)", marginBottom: "5px" }}>Template Code</label>
                <input
                  type="text"
                  value={editTemplateCode}
                  onChange={(e) => setEditTemplateCode(e.target.value)}
                  placeholder="WELCOME_EMAIL"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-color)",
                    color: "var(--text-main)",
                    marginBottom: "15px",
                    width: "100%",
                  }}
                />
              </>
            )}
            <label style={{ color: "var(--text-muted)", marginBottom: "5px" }}>Subject Line</label>
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              placeholder="Subject"
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-color)",
                color: "var(--text-main)",
                marginBottom: "15px",
                width: "100%",
              }}
            />

            <label style={{ color: "var(--text-muted)", marginBottom: "5px" }}>
              JSON Variables (for preview)
            </label>
            <textarea
              className="editorTextarea"
              style={{ flex: 0.3, marginBottom: "15px", fontFamily: "monospace" }}
              value={editJson}
              onChange={(e) => handleJsonChange(e.target.value)}
            />

            <label style={{ color: "var(--text-muted)", marginBottom: "5px" }}>HTML Template</label>
            <textarea
              className="editorTextarea"
              style={{ flex: 0.7, fontFamily: "monospace" }}
              value={editHtml}
              onChange={(e) => handleHtmlChange(e.target.value)}
            />
          </div>

          <div className="editorPanel" style={{ flex: 0.6, display: "flex", flexDirection: "column" }}>
            <label style={{ color: "var(--text-muted)", marginBottom: "10px" }}>Live Preview</label>
            <div
              style={{
                background: "white",
                color: "black",
                flex: 1,
                padding: "20px",
                borderRadius: "8px",
                overflowY: "auto",
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
