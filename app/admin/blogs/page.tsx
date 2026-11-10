"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";
import type { BlogArticleAdmin } from "./BlogEditorModal";

// Dynamically lazy-load the heavy Blog Editor Modal
const BlogEditorModal = dynamic(() => import("./BlogEditorModal"), {
  ssr: false,
  loading: () => (
    <div className="modalOverlay">
      <div
        className="modalContent"
        style={{
          width: "90vw",
          height: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "10px", color: "#E4521B" }}></i>
          Loading Blog Studio Editor...
        </div>
      </div>
    </div>
  ),
});

export default function BlogManagementPage() {
  const [articles, setArticles] = useState<BlogArticleAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticleAdmin | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(API_ENDPOINTS.blogs.base);
      if (res.ok) {
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      } else {
        throw new Error(`Failed to fetch articles (Status ${res.status})`);
      }
    } catch (err: any) {
      console.error("Failed to load articles:", err);
      setError(err?.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const openCreator = () => {
    setIsCreating(true);
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const openEditor = (article: BlogArticleAdmin) => {
    setIsCreating(false);
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also purge it from the public website cache.`)) {
      return;
    }

    try {
      const res = await apiClient.delete(API_ENDPOINTS.blogs.byId(id));
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete article");
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting article");
    }
  };

  // Stats calculation
  const totalCount = articles.length;
  const publishedCount = articles.filter((a) => a.status === "PUBLISHED").length;
  const draftCount = articles.filter((a) => a.status === "DRAFT").length;

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [articles, searchQuery, filterStatus]);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
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
            <h2 style={{ color: "var(--text-main)", margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>
              Blog Studio
            </h2>
          </div>
          <p style={{ margin: "6px 0 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Create articles with Cloudflare R2 thumbnails (&lt; 200KB), JSONB storage & on-demand Next.js ISR.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="btn btn-outline"
            style={{ width: "auto", padding: "10px 14px" }}
            onClick={fetchArticles}
            title="Refresh articles"
          >
            <i className={`fa-solid fa-rotate ${loading ? "fa-spin" : ""}`}></i>
          </button>
          <button
            className="btn btn-primary"
            style={{
              width: "auto",
              padding: "10px 20px",
              backgroundColor: "#E4521B",
              borderColor: "#E4521B",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 24px -6px rgba(228, 82, 27, 0.5)",
            }}
            onClick={openCreator}
          >
            <i className="fa-solid fa-plus"></i> Write New Article
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Articles
            </p>
            <h4 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-main)" }}>
              {totalCount}
            </h4>
          </div>
          <i className="fa-solid fa-layer-group" style={{ fontSize: "1.4rem", color: "var(--text-muted)", opacity: 0.5 }}></i>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Published Live
            </p>
            <h4 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", fontWeight: 700, color: "#34D399" }}>
              {publishedCount}
            </h4>
          </div>
          <i className="fa-solid fa-circle-check" style={{ fontSize: "1.4rem", color: "#34D399", opacity: 0.6 }}></i>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Drafts
            </p>
            <h4 style={{ margin: "4px 0 0 0", fontSize: "1.4rem", fontWeight: 700, color: "#F59E0B" }}>
              {draftCount}
            </h4>
          </div>
          <i className="fa-solid fa-file-pen" style={{ fontSize: "1.4rem", color: "#F59E0B", opacity: 0.6 }}></i>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {articles.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            ></i>
            <input
              type="text"
              className="inputField"
              placeholder="Search by title, category, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "38px" }}
            />
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["ALL", "PUBLISHED", "DRAFT"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: filterStatus === st ? "var(--primary)" : "rgba(255, 255, 255, 0.05)",
                  color: filterStatus === st ? "#FFFFFF" : "var(--text-muted)",
                }}
              >
                {st === "ALL" ? "All Posts" : st === "PUBLISHED" ? "Published" : "Drafts"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#EF4444",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "8px" }}></i>
            {error} (Your backend might be asleep on the Hobby plan — waking up in progress...)
          </span>
          <button className="btn btn-sm btn-outline" onClick={fetchArticles}>
            Retry
          </button>
        </div>
      )}

      {/* Skeleton Loading State */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "20px",
                minHeight: "260px",
              }}
            >
              <div className="skeleton" style={{ width: "100%", height: "140px", marginBottom: "14px", borderRadius: "10px" }}></div>
              <div className="skeleton" style={{ width: "75%", height: "20px", marginBottom: "10px" }}></div>
              <div className="skeleton" style={{ width: "45%", height: "14px" }}></div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "22px" }}>
          {filteredArticles.map((article) => {
            const isPublished = article.status === "PUBLISHED";
            return (
              <div
                key={article.id}
                style={{
                  background: "var(--card-bg, rgba(22, 24, 30, 0.6))",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Thumbnail Header */}
                <div style={{ position: "relative", width: "100%", height: "180px", background: "rgba(0, 0, 0, 0.4)" }}>
                  {article.mainImage ? (
                    <img
                      src={article.mainImage}
                      alt={article.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      <i className="fa-solid fa-image" style={{ fontSize: "2rem", opacity: 0.5 }}></i>
                    </div>
                  )}

                  {/* Status Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      padding: "4px 10px",
                      borderRadius: "100px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      backgroundColor: isPublished ? "rgba(16, 185, 129, 0.95)" : "rgba(107, 114, 128, 0.95)",
                      color: "#FFFFFF",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    {isPublished ? "Published" : "Draft"}
                  </span>

                  {/* Category Pill */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: "rgba(15, 17, 23, 0.88)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#FFFFFF",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {article.category}
                  </span>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      lineHeight: 1.35,
                      color: "var(--text-main)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {article.title}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      flex: 1,
                    }}
                  >
                    {article.description}
                  </p>

                  {/* Card Meta & Action Bar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-regular fa-clock"></i>
                      {article.readTime || "5 min read"}
                    </span>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        onClick={() => openEditor(article)}
                        title="Edit Article"
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#EF4444",
                        }}
                        onClick={() => handleDelete(article.id, article.title)}
                        title="Delete Article"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Polished Empty State */}
          {articles.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "60px 24px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "20px",
                border: "1px dashed rgba(255, 255, 255, 0.12)",
                maxWidth: "600px",
                margin: "40px auto 0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "18px",
                  background: "rgba(228, 82, 27, 0.12)",
                  border: "1px solid rgba(228, 82, 27, 0.25)",
                  color: "#E4521B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  marginBottom: "18px",
                  boxShadow: "0 8px 24px rgba(228, 82, 27, 0.2)",
                }}
              >
                <i className="fa-solid fa-newspaper"></i>
              </div>

              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontSize: "1.25rem", fontWeight: 700 }}>
                No Blog Articles Published Yet
              </h3>
              <p style={{ margin: "0 0 24px 0", color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5, maxWidth: "420px" }}>
                Write your first article with direct Cloudflare R2 uploads and switch between Visual Builder and raw JSON mode.
              </p>

              <button
                className="btn btn-primary"
                style={{
                  width: "auto",
                  padding: "12px 28px",
                  backgroundColor: "#E4521B",
                  borderColor: "#E4521B",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  boxShadow: "0 8px 24px -4px rgba(228, 82, 27, 0.5)",
                }}
                onClick={openCreator}
              >
                <i className="fa-solid fa-plus"></i> Write First Article
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <BlogEditorModal
          isOpen={isModalOpen}
          isCreating={isCreating}
          editingArticle={editingArticle}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchArticles}
        />
      )}
    </div>
  );
}
