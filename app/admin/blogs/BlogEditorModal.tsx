"use client";

import React, { useState, useEffect, useMemo } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

export interface BlogArticleAdmin {
  id: string | number;
  slug: string;
  title: string;
  category: string;
  publishDate: string;
  readTime: string;
  mainImage: string;
  description: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  links?: any[];
  sections: any[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string;
  createdAt?: string;
}

interface BlogEditorModalProps {
  isOpen: boolean;
  isCreating: boolean;
  editingArticle: BlogArticleAdmin | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_THUMBNAIL_BYTES = 200 * 1024; // 200 KB Strict Limit
const MIN_WORD_COUNT = 1500; // Strict 1500 words minimum for publishing

function calculateWordCount(sectionsList: any[], desc: string): number {
  let combined = desc ? desc + " " : "";
  if (Array.isArray(sectionsList)) {
    for (const sec of sectionsList) {
      if (sec.text) combined += sec.text + " ";
      if (sec.title) combined += sec.title + " ";
      if (sec.description) combined += sec.description + " ";
      if (sec.caption) combined += sec.caption + " ";
      if (sec.citation) combined += sec.citation + " ";
      if (Array.isArray(sec.headers)) combined += sec.headers.join(" ") + " ";
      if (Array.isArray(sec.rows)) {
        for (const r of sec.rows) {
          if (Array.isArray(r)) combined += r.join(" ") + " ";
        }
      }
    }
  }
  const words = combined.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

const DEFAULT_CATEGORIES = [
  "Engineering",
  "Architecture",
  "Cloud & DevOps",
  "Design Systems",
  "AI & Automation",
  "Web Performance",
  "Technical SEO",
];

const EXAMPLE_SECTIONS_TEMPLATE = [
  {
    type: "heading",
    level: 2,
    text: "Architecting Resilient Cloud Systems"
  },
  {
    type: "paragraph",
    text: "Modern cloud applications must decouple dynamic data operations from high-traffic marketing surfaces. By utilizing edge caching and serverless object storage, performance bottlenecks are eliminated."
  },
  {
    type: "callout",
    variant: "tip",
    text: "Always serve static assets and blog snapshots from edge CDNs to allow backends to sleep safely without impacting SEO.",
    citation: "KodeToMates Engineering"
  },
  {
    type: "image",
    src: "https://assets.kodetomates.in/blogs/thumbnails/architecture-diagram.webp",
    alt: "System Architecture Flow",
    caption: "Decoupled edge architecture with Cloudflare R2 and Next.js ISR"
  },
  {
    type: "table",
    caption: "Latency Benchmark Comparison",
    headers: ["Request Type", "Cold Start", "Edge Cached"],
    rows: [
      ["SSR Direct Fetch", "2,400ms - 8,000ms", "N/A"],
      ["Next.js On-Demand ISR", "0ms (Background)", "35ms - 60ms"]
    ]
  },
  {
    type: "cta",
    title: "Need an architectural audit for your web application?",
    description: "Let our engineering team benchmark and optimize your systems.",
    buttonText: "Request Technical Audit",
    buttonHref: "/contact"
  }
];

export default function BlogEditorModal({
  isOpen,
  isCreating,
  editingArticle,
  onClose,
  onSuccess,
}: BlogEditorModalProps) {
  // Mode selection: 'metadata' | 'visual' | 'json'
  const [activeTab, setActiveTab] = useState<"metadata" | "visual" | "json">("metadata");

  // Metadata Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [readTime, setReadTime] = useState("5 min read");
  const [description, setDescription] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [authorName, setAuthorName] = useState("Team KodeToMates");
  const [authorRole, setAuthorRole] = useState("Cloud & AI Architects");
  const [authorAvatar, setAuthorAvatar] = useState("https://assets.kodetomates.in/avatars/default.webp");

  // Content Sections (Visual array + raw JSON string sync)
  const [sections, setSections] = useState<any[]>([]);
  const [rawJson, setRawJson] = useState<string>("[]");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Upload & Save States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Live Word Count across all sections + summary
  const currentWordCount = useMemo(() => {
    let currentSections = sections;
    if (activeTab === "json") {
      try {
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed)) currentSections = parsed;
      } catch {}
    }
    return calculateWordCount(currentSections, description);
  }, [sections, rawJson, description, activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    if (isCreating) {
      setTitle("");
      setSlug("");
      setCategory("Engineering");
      setReadTime("5 min read");
      setDescription("");
      setMainImage("");
      const storedName = localStorage.getItem("userName") || "Team KodeToMates";
      setAuthorName(storedName);
      setAuthorRole("Lead Architect");
      setAuthorAvatar("https://assets.kodetomates.in/avatars/default.webp");

      const initialSections = [
        { type: "heading", level: 2, text: "Introduction" },
        { type: "paragraph", text: "Start writing your article insights here..." },
      ];
      setSections(initialSections);
      setRawJson(JSON.stringify(initialSections, null, 2));
      setJsonError(null);
      setImageSizeKb(null);
      setUploadError(null);
      setActiveTab("metadata");
    } else if (editingArticle) {
      setTitle(editingArticle.title || "");
      setSlug(editingArticle.slug || "");
      setCategory(editingArticle.category || "Engineering");
      setReadTime(editingArticle.readTime || "5 min read");
      setDescription(editingArticle.description || "");
      setMainImage(editingArticle.mainImage || "");
      setAuthorName(editingArticle.author?.name || "Team KodeToMates");
      setAuthorRole(editingArticle.author?.role || "Cloud Architect");
      setAuthorAvatar(editingArticle.author?.avatar || "https://assets.kodetomates.in/avatars/default.webp");

      const existingSections = Array.isArray(editingArticle.sections) ? editingArticle.sections : [];
      setSections(existingSections);
      setRawJson(JSON.stringify(existingSections, null, 2));
      setJsonError(null);
      setImageSizeKb(null);
      setUploadError(null);
      setActiveTab("metadata");
    }
  }, [isOpen, isCreating, editingArticle]);

  if (!isOpen) return null;

  // Auto-slugify when title changes in creation mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isCreating && (!slug || slug === title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"))) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  // Two-way sync: Switch between tabs
  const handleTabSwitch = (newTab: "metadata" | "visual" | "json") => {
    if (activeTab === "visual" && newTab === "json") {
      // Sync visual array -> JSON string
      setRawJson(JSON.stringify(sections, null, 2));
      setJsonError(null);
    } else if (activeTab === "json" && newTab === "visual") {
      // Validate and parse JSON string -> visual array
      try {
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed)) {
          setSections(parsed);
          setJsonError(null);
        } else {
          setJsonError("JSON must be an array of section objects (e.g. [ { type: 'heading', ... } ])");
          return;
        }
      } catch (err: any) {
        setJsonError(`Invalid JSON syntax: ${err.message}`);
        return;
      }
    }
    setActiveTab(newTab);
  };

  // Direct JSON input handler with real-time validation
  const handleJsonChange = (val: string) => {
    setRawJson(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        setSections(parsed);
        setJsonError(null);
      } else {
        setJsonError("Root JSON structure must be an Array [ ... ] of sections.");
      }
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  // Prettify / Format JSON in editor
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      setRawJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`Cannot format invalid JSON: ${err.message}`);
    }
  };

  // Load example template
  const handleLoadExampleTemplate = () => {
    if (confirm("Replace current sections with the full example template?")) {
      setSections(EXAMPLE_SECTIONS_TEMPLATE);
      setRawJson(JSON.stringify(EXAMPLE_SECTIONS_TEMPLATE, null, 2));
      setJsonError(null);
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJson);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Direct Cloudflare R2 Upload with 200KB limit
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Strict 200KB check
    if (file.size > MAX_THUMBNAIL_BYTES) {
      const actualSizeKb = (file.size / 1024).toFixed(1);
      setUploadError(`File is ${actualSizeKb} KB. Maximum allowed size is 200 KB. Please compress your image.`);
      return;
    }

    setImageSizeKb(Math.round(file.size / 1024));
    setUploadingImage(true);

    try {
      const currentSlug = slug || "post";
      const presignUrl = `${API_ENDPOINTS.blogs.presignThumbnail}?slug=${encodeURIComponent(currentSlug)}&fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`;

      const res = await apiClient.get(presignUrl);
      if (!res.ok) {
        throw new Error("Failed to generate presigned upload URL from backend");
      }

      const { uploadUrl, publicUrl } = await res.json();

      // Direct binary PUT upload straight to Cloudflare R2!
      const r2Response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/webp",
        },
        body: file,
      });

      if (!r2Response.ok) {
        throw new Error(`R2 direct upload failed with status ${r2Response.status}`);
      }

      setMainImage(publicUrl);
    } catch (err: any) {
      console.error("R2 Upload error:", err);
      setUploadError(err?.message || "Failed to upload image to Cloudflare R2");
    } finally {
      setUploadingImage(false);
    }
  };

  // Visual Section Actions
  const addSection = (type: string) => {
    let newSec: any = { type };
    if (type === "heading") newSec = { type: "heading", level: 2, text: "Section Heading" };
    else if (type === "paragraph") newSec = { type: "paragraph", text: "" };
    else if (type === "callout") newSec = { type: "callout", variant: "tip", text: "Important architectural takeaway...", citation: "" };
    else if (type === "image") newSec = { type: "image", src: "", alt: "Image description", caption: "" };
    else if (type === "table") newSec = { type: "table", caption: "Comparison Table", headers: ["Feature", "Standard", "Optimized"], rows: [["TTFB", "800ms", "45ms"]] };
    else if (type === "cta") newSec = { type: "cta", title: "Ready to scale?", description: "Contact our team for a free consultation.", buttonText: "Get in Touch", buttonHref: "/contact" };

    const updated = [...sections, newSec];
    setSections(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const updateSection = (index: number, updatedFields: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...updatedFields };
    setSections(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const removeSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setSections(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  // Save handler (Draft vs Publish with strict validation)
  const handleSave = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    const errors: string[] = [];

    // Title validation
    if (!title.trim() || title.trim().length < 8) {
      errors.push("Article title is required and must be at least 8 characters long.");
    }

    // Slug validation
    if (!slug.trim()) {
      errors.push("URL slug is required.");
    } else if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      errors.push("URL slug must contain only lowercase letters, numbers, and hyphens.");
    }

    // Cover thumbnail validation
    if (!mainImage.trim()) {
      errors.push("Cover thumbnail image is required (< 200 KB).");
    }

    // Description validation
    if (!description.trim() || description.trim().length < 40) {
      errors.push("Short Summary / SEO Description must be at least 40 characters for search visibility.");
    }

    // Author validation
    if (!authorName.trim()) {
      errors.push("Author name is required.");
    }

    // JSON syntax validation
    let finalSections = sections;
    if (activeTab === "json") {
      try {
        const parsed = JSON.parse(rawJson);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          errors.push("JSON content must be a non-empty array of section blocks.");
        } else {
          finalSections = parsed;
        }
      } catch (e: any) {
        errors.push(`Invalid JSON syntax in JSON Mode: ${e.message}`);
      }
    } else if (sections.length < 2) {
      errors.push("Article must have at least 2 content sections.");
    }

    // STRICT 1500 WORDS MINIMUM VALIDATION FOR PUBLISHING
    const wordCount = calculateWordCount(finalSections, description);
    if (targetStatus === "PUBLISHED" && wordCount < MIN_WORD_COUNT) {
      const missing = MIN_WORD_COUNT - wordCount;
      errors.push(
        `Article content must contain at least 1,500 words to be published live. Current word count: ${wordCount.toLocaleString()} words (needs ${missing.toLocaleString()} more words).`
      );
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        readTime,
        mainImage,
        description: description.trim(),
        authorName: authorName.trim(),
        authorRole: authorRole.trim(),
        authorAvatar,
        status: targetStatus,
        sections: finalSections,
        links: [],
      };

      let res;
      if (isCreating) {
        res = await apiClient.post(API_ENDPOINTS.blogs.base, payload);
      } else {
        res = await apiClient.put(API_ENDPOINTS.blogs.byId(editingArticle!.id), payload);
      }

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setValidationErrors([errorData.message || "Failed to save article"]);
      }
    } catch (err: any) {
      setValidationErrors([err?.message || "Failed to communicate with backend"]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalOverlay" style={{ zIndex: 1100 }}>
      <div
        className="modalContent"
        style={{
          width: "94vw",
          maxWidth: "1180px",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background: "var(--modal-bg, rgba(18, 20, 26, 0.95))",
          backdropFilter: "blur(28px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(228, 82, 27, 0.25)",
        }}
      >
        {/* Modal Top Header Bar */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.02)",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Title & Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(228, 82, 27, 0.15)",
                border: "1px solid rgba(228, 82, 27, 0.3)",
                color: "#E4521B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
              }}
            >
              <i className="fa-solid fa-newspaper"></i>
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)" }}>
                {isCreating ? "New Blog Article" : `Edit Article: ${title || "Untitled"}`}
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Cloudflare R2 Direct Uploads &bull; PostgreSQL JSONB &bull; Next.js ISR
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "flex",
              background: "rgba(0, 0, 0, 0.4)",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              gap: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => handleTabSwitch("metadata")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "metadata" ? "var(--primary)" : "transparent",
                color: activeTab === "metadata" ? "#FFFFFF" : "var(--text-muted)",
                boxShadow: activeTab === "metadata" ? "0 2px 10px rgba(228, 82, 27, 0.4)" : "none",
              }}
            >
              <i className="fa-solid fa-sliders" style={{ marginRight: "6px" }}></i>
              1. Metadata & Cover
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("visual")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "visual" ? "var(--primary)" : "transparent",
                color: activeTab === "visual" ? "#FFFFFF" : "var(--text-muted)",
                boxShadow: activeTab === "visual" ? "0 2px 10px rgba(228, 82, 27, 0.4)" : "none",
              }}
            >
              <i className="fa-solid fa-layer-group" style={{ marginRight: "6px" }}></i>
              2. Visual Builder ({sections.length})
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("json")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "json" ? "var(--primary)" : "transparent",
                color: activeTab === "json" ? "#FFFFFF" : "var(--text-muted)",
                boxShadow: activeTab === "json" ? "0 2px 10px rgba(228, 82, 27, 0.4)" : "none",
              }}
            >
              <i className="fa-solid fa-code" style={{ marginRight: "6px" }}></i>
              3. JSON Mode (JSONB)
            </button>
          </div>

          {/* Live Word Count & SEO Status Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "100px",
              fontSize: "0.82rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono), monospace",
              background: currentWordCount >= MIN_WORD_COUNT ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              border: currentWordCount >= MIN_WORD_COUNT ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(245, 158, 11, 0.35)",
              color: currentWordCount >= MIN_WORD_COUNT ? "#34D399" : "#FBBF24",
            }}
            title={
              currentWordCount >= MIN_WORD_COUNT
                ? "Word count meets the 1,500 minimum requirement for publishing."
                : `Need ${MIN_WORD_COUNT - currentWordCount} more words to reach 1,500 words.`
            }
          >
            <i className={currentWordCount >= MIN_WORD_COUNT ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"}></i>
            <span>{currentWordCount.toLocaleString()} / 1,500 words</span>
            {currentWordCount >= MIN_WORD_COUNT ? (
              <span style={{ fontSize: "0.72rem", opacity: 0.85 }}>(Ready)</span>
            ) : (
              <span style={{ fontSize: "0.72rem", opacity: 0.85 }}>({(MIN_WORD_COUNT - currentWordCount).toLocaleString()} needed)</span>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "var(--text-muted)",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              transition: "all 0.2s ease",
            }}
          >
            &times;
          </button>
        </div>

        {/* Validation Errors Alert Banner */}
        {validationErrors.length > 0 && (
          <div
            style={{
              margin: "16px 24px 0 24px",
              padding: "14px 18px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#EF4444",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <strong style={{ fontSize: "0.9rem" }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "8px" }}></i>
                Please address the following validation requirements:
              </strong>
              <button
                type="button"
                onClick={() => setValidationErrors([])}
                style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "1.2rem", padding: "0 4px" }}
              >
                &times;
              </button>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", lineHeight: 1.6 }}>
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* TAB 1: METADATA & COVER THUMBNAIL */}
          {activeTab === "metadata" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.85fr", gap: "28px" }}>
              {/* Left Column: Form Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                    Article Title *
                  </label>
                  <input
                    type="text"
                    className="inputField"
                    placeholder="e.g. Architecting Scalable Cloudflare R2 & Next.js Workflows"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      className="inputField"
                      placeholder="e.g. architecting-scalable-r2"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                      Category
                    </label>
                    <select
                      className="selectField"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                      Estimated Read Time
                    </label>
                    <input
                      type="text"
                      className="inputField"
                      placeholder="e.g. 5 min read"
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                      Author Name
                    </label>
                    <input
                      type="text"
                      className="inputField"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>
                    Short Summary / SEO Description *
                  </label>
                  <textarea
                    rows={4}
                    className="textareaField"
                    placeholder="Brief 1-2 sentence overview shown in blog cards and Google SERP snippets..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Right Column: Cloudflare R2 Direct Thumbnail Upload */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-main)", margin: 0 }}>
                    Cover Thumbnail
                  </label>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "100px",
                      backgroundColor: "rgba(228, 82, 27, 0.15)",
                      border: "1px solid rgba(228, 82, 27, 0.3)",
                      color: "#E4521B",
                    }}
                  >
                    Max 200 KB (Strict)
                  </span>
                </div>

                <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                  Binary upload directly to Cloudflare R2 bucket. Fast, CDN-accelerated, zero egress cost.
                </p>

                {/* Drag & Drop Input Zone */}
                <div
                  style={{
                    border: "2px dashed rgba(228, 82, 27, 0.35)",
                    borderRadius: "12px",
                    padding: "28px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                    background: "rgba(0, 0, 0, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="file"
                    accept="image/webp,image/jpeg,image/png"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingImage}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  {uploadingImage ? (
                    <div>
                      <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "#E4521B", fontSize: "1.8rem" }}></i>
                      <p style={{ margin: "10px 0 0 0", fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 500 }}>
                        Uploading directly to Cloudflare R2...
                      </p>
                    </div>
                  ) : (
                    <div>
                      <i className="fa-solid fa-cloud-arrow-up" style={{ color: "#E4521B", fontSize: "2rem", marginBottom: "8px" }}></i>
                      <p style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)" }}>
                        Click or drag image here
                      </p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        WebP, JPG, or PNG (strictly under 200 KB)
                      </p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#EF4444",
                      fontSize: "0.82rem",
                    }}
                  >
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "6px" }}></i>
                    {uploadError}
                  </div>
                )}

                {/* Thumbnail Preview Card */}
                {mainImage && (
                  <div style={{ marginTop: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>R2 Image Loaded:</span>
                      {imageSizeKb && (
                        <span style={{ fontWeight: 600, color: "#10B981" }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i>
                          {imageSizeKb} KB
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "170px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <img
                        src={mainImage}
                        alt="Thumbnail Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                        wordBreak: "break-all",
                        marginTop: "8px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.4)",
                      }}
                    >
                      {mainImage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL SECTIONS BUILDER */}
          {activeTab === "visual" && (
            <div>
              {/* Toolbar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>
                    Structured Section Blocks
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Add building blocks that render responsively on your marketing blog page.
                  </p>
                </div>

                {/* Add Section Buttons */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addSection("heading")}>
                    + Heading
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addSection("paragraph")}>
                    + Paragraph
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addSection("callout")}>
                    + Callout
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addSection("image")}>
                    + Image
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addSection("table")}>
                    + Table
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addSection("cta")}>
                    + CTA
                  </button>
                </div>
              </div>

              {/* Sections List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {sections.map((sec, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "18px",
                      position: "relative",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    {/* Section Header Controls */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                        paddingBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(228, 82, 27, 0.15)",
                            border: "1px solid rgba(228, 82, 27, 0.3)",
                            color: "#E4521B",
                          }}
                        >
                          #{idx + 1} &bull; {sec.type}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: "6px 12px" }}
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, "up")}
                          title="Move Up"
                        >
                          <i className="fa-solid fa-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ padding: "6px 12px" }}
                          disabled={idx === sections.length - 1}
                          onClick={() => moveSection(idx, "down")}
                          title="Move Down"
                        >
                          <i className="fa-solid fa-arrow-down"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            padding: "6px 12px",
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#EF4444",
                          }}
                          onClick={() => removeSection(idx)}
                          title="Remove Section"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    {/* Section Content Fields */}
                    {sec.type === "heading" && (
                      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "14px" }}>
                        <select
                          className="selectField"
                          value={sec.level || 2}
                          onChange={(e) => updateSection(idx, { level: Number(e.target.value) })}
                        >
                          <option value={2}>H2 Heading</option>
                          <option value={3}>H3 Heading</option>
                        </select>
                        <input
                          type="text"
                          className="inputField"
                          placeholder="Heading text..."
                          value={sec.text || ""}
                          onChange={(e) => updateSection(idx, { text: e.target.value })}
                        />
                      </div>
                    )}

                    {sec.type === "paragraph" && (
                      <textarea
                        rows={4}
                        className="textareaField"
                        placeholder="Write paragraph copy..."
                        value={sec.text || ""}
                        onChange={(e) => updateSection(idx, { text: e.target.value })}
                      />
                    )}

                    {sec.type === "callout" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "14px" }}>
                          <select
                            className="selectField"
                            value={sec.variant || "tip"}
                            onChange={(e) => updateSection(idx, { variant: e.target.value })}
                          >
                            <option value="tip">💡 Tip Box</option>
                            <option value="info">ℹ️ Info Box</option>
                            <option value="quote">💬 Quote Box</option>
                          </select>
                          <input
                            type="text"
                            className="inputField"
                            placeholder="Citation or author (optional)..."
                            value={sec.citation || ""}
                            onChange={(e) => updateSection(idx, { citation: e.target.value })}
                          />
                        </div>
                        <textarea
                          rows={2}
                          className="textareaField"
                          placeholder="Callout highlight copy..."
                          value={sec.text || ""}
                          onChange={(e) => updateSection(idx, { text: e.target.value })}
                        />
                      </div>
                    )}

                    {sec.type === "image" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                            Image URL (Cloudflare R2)
                          </label>
                          <input
                            type="text"
                            className="inputField"
                            placeholder="https://assets.kodetomates.in/blogs/..."
                            value={sec.src || ""}
                            onChange={(e) => updateSection(idx, { src: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                            Alt Description & Caption
                          </label>
                          <input
                            type="text"
                            className="inputField"
                            placeholder="Descriptive alt text for SEO..."
                            value={sec.alt || ""}
                            onChange={(e) => updateSection(idx, { alt: e.target.value, caption: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {sec.type === "cta" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <input
                          type="text"
                          className="inputField"
                          placeholder="CTA Title"
                          value={sec.title || ""}
                          onChange={(e) => updateSection(idx, { title: e.target.value })}
                        />
                        <input
                          type="text"
                          className="inputField"
                          placeholder="Button Label (e.g. Schedule Call)"
                          value={sec.buttonText || ""}
                          onChange={(e) => updateSection(idx, { buttonText: e.target.value })}
                        />
                        <input
                          type="text"
                          className="inputField"
                          placeholder="Button Link (e.g. /contact)"
                          value={sec.buttonHref || ""}
                          onChange={(e) => updateSection(idx, { buttonHref: e.target.value })}
                        />
                        <input
                          type="text"
                          className="inputField"
                          placeholder="CTA Subtitle/Description"
                          value={sec.description || ""}
                          onChange={(e) => updateSection(idx, { description: e.target.value })}
                        />
                      </div>
                    )}

                    {sec.type === "table" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input
                          type="text"
                          className="inputField"
                          placeholder="Table Caption..."
                          value={sec.caption || ""}
                          onChange={(e) => updateSection(idx, { caption: e.target.value })}
                        />
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                          Tip: Use <strong>JSON Mode (Tab 3)</strong> to quickly edit and paste full complex tables or charts!
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {sections.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "50px 20px",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: "14px",
                      border: "1px dashed rgba(255, 255, 255, 0.1)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <i className="fa-solid fa-layer-group" style={{ fontSize: "2rem", color: "rgba(228, 82, 27, 0.6)", marginBottom: "12px" }}></i>
                    <p style={{ margin: "0 0 6px 0", color: "var(--text-main)", fontWeight: 600 }}>No Sections Added Yet</p>
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                      Click any button above to add Headings, Paragraphs, or switch to <strong>JSON Mode</strong> to paste raw data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT JSON MODE (JSONB COLUMN UPLOAD & EDIT) */}
          {activeTab === "json" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px" }}>
              {/* JSON Toolbar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                    <i className="fa-solid fa-database" style={{ color: "#E4521B", marginRight: "6px" }}></i>
                    PostgreSQL `sections_json` (JSONB)
                  </span>

                  {jsonError ? (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "100px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#EF4444",
                      }}
                    >
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "4px" }}></i>
                      Invalid JSON
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "100px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#34D399",
                      }}
                    >
                      <i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i>
                      Valid JSON ({sections.length} blocks)
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleFormatJson}
                    title="Prettify and format JSON"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> Prettify
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleLoadExampleTemplate}
                    title="Load complete example JSON"
                  >
                    <i className="fa-solid fa-file-code"></i> Load Example
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleCopyJson}
                    title="Copy to clipboard"
                  >
                    <i className="fa-solid fa-copy"></i> {copyFeedback ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {jsonError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#EF4444",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {jsonError}
                </div>
              )}

              {/* Code Editor Textarea */}
              <div style={{ flex: 1, minHeight: "380px", display: "flex" }}>
                <textarea
                  value={rawJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  spellCheck={false}
                  placeholder='[\n  {\n    "type": "heading",\n    "level": 2,\n    "text": "Your Heading"\n  }\n]'
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "380px",
                    background: "rgba(10, 11, 14, 0.85)",
                    color: "#38BDF8",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "14px",
                    padding: "18px",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "0.88rem",
                    lineHeight: "1.6",
                    outline: "none",
                    resize: "vertical",
                    boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.6)",
                  }}
                />
              </div>

              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                💡 <strong>Tip:</strong> You can paste an entire JSON array generated by ChatGPT, Claude, or Antigravity here. It synchronizes automatically with the Visual Builder!
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.02)",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <button type="button" className="btn btn-outline" style={{ width: "auto" }} onClick={onClose} disabled={saving}>
            Cancel
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: "auto" }}
              disabled={saving}
              onClick={() => handleSave("DRAFT")}
            >
              <i className="fa-regular fa-floppy-disk"></i> Save as Draft
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              style={{
                width: "auto",
                backgroundColor: "#E4521B",
                borderColor: "#E4521B",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 8px 24px -4px rgba(228, 82, 27, 0.5)",
              }}
              onClick={() => handleSave("PUBLISHED")}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Saving & Revalidating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> 🚀 Publish Article
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
