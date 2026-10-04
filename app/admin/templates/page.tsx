"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

interface EmailTemplate {
  id: number;
  templateCode: string;
  subject: string;
  templateData: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editTemplateCode, setEditTemplateCode] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editJson, setEditJson] = useState("{}");
  const [editHtml, setEditHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

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
    setEditTemplateCode(template.templateCode || "");
    setEditSubject(template.subject || "");
    
    // Parse templateData map from backend
    const tData = template.templateData || {};
    setEditJson(JSON.stringify(tData.variables || {}, null, 2));
    setEditHtml(tData.html || "");
    
    // Set initial preview
    updatePreview(tData.html || "", JSON.stringify(tData.variables || {}));
    setIsModalOpen(true);
  };

  const openCreator = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setEditTemplateCode("");
    setEditSubject("");
    setEditJson("{}");
    setEditHtml("");
    setPreviewHtml("");
    setIsModalOpen(true);
  };

  const updatePreview = (htmlString: string, jsonString: string) => {
    try {
      let finalHtml = htmlString;
      const vars = JSON.parse(jsonString || "{}");
      // Basic replace for preview {{key}}
      Object.keys(vars).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        finalHtml = finalHtml.replace(regex, vars[key]);
      });
      setPreviewHtml(finalHtml);
    } catch (e) {
      setPreviewHtml(htmlString); // If JSON is invalid, just show raw HTML
    }
  };

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
      const token = localStorage.getItem("token");
      let parsedVariables = {};
      try {
        parsedVariables = JSON.parse(editJson);
      } catch (e) {
        alert("Invalid JSON format for variables.");
        return;
      }

      const payload = {
        templateCode: editTemplateCode,
        subject: editSubject,
        templateData: {
          html: editHtml,
          variables: parsedVariables
        }
      };

      let res;
      if (isCreating) {
        res = await apiClient.post(API_ENDPOINTS.template.base, payload);
      } else {
        res = await apiClient.put(API_ENDPOINTS.template.byId(editingTemplate!.id), payload);
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchTemplates();
      } else {
        alert("Failed to save template.");
      }
    } catch (err) {
      console.error("Failed to update template:", err);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ color: "var(--text-main)" }}>Email Templates</h2>
        <button className="btn" style={{ width: "auto" }} onClick={openCreator}>
          <i className="fa-solid fa-plus"></i> Create New Template
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading templates...</div>
      ) : (
        <div className="gridCards">
          {templates.map(template => (
            <div className="templateCard" key={template.id}>
              <div className="cardHeader">
                <h3>{template.templateCode}</h3>
              </div>
              <p className="cardDesc" style={{ marginBottom: "5px" }}><strong>Subject:</strong> {template.subject}</p>
              <div className="cardFooter" style={{ marginTop: "15px" }}>
                <span className={`badge ${template.isActive ? 'badge-success' : 'badge-outline'}`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="btnGroup">
                  <button className="btn btn-sm" onClick={() => openEditor(template)}>Edit</button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>No templates found in database.</div>
          )}
        </div>
      )}

      {isModalOpen && (isCreating || editingTemplate) && (
        <div className="modalOverlay">
          <div className="modalContent" style={{ width: "95vw", height: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modalHeader" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-main)" }}>
                  {isCreating ? "Create New Template" : `Editing: ${editingTemplate?.templateCode}`}
                </h2>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-outline btn-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn btn-sm" onClick={handleSave}>Save Changes</button>
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
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)", marginBottom: "15px", width: "100%" }}
                    />
                  </>
                )}
                <label style={{ color: "var(--text-muted)", marginBottom: "5px" }}>Subject Line</label>
                <input 
                  type="text" 
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)", marginBottom: "15px", width: "100%" }}
                />
                
                <label style={{ color: "var(--text-muted)", marginBottom: "5px" }}>JSON Variables (for preview)</label>
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
                <div style={{ background: "white", color: "black", flex: 1, padding: "20px", borderRadius: "8px", overflowY: "auto" }}>
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
