import React from "react";

export default function AdminLoading() {
  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      {/* Metric Cards Skeleton */}
      <div className="gridCards">
        <div className="card skeletonCard">
          <div className="cardHeader">
            <div className="skeleton" style={{ width: "100px", height: "16px" }}></div>
            <div className="skeleton" style={{ width: "24px", height: "24px", borderRadius: "50%" }}></div>
          </div>
          <div className="skeleton" style={{ width: "60px", height: "36px", marginTop: "10px" }}></div>
        </div>
        <div className="card skeletonCard">
          <div className="cardHeader">
            <div className="skeleton" style={{ width: "120px", height: "16px" }}></div>
            <div className="skeleton" style={{ width: "24px", height: "24px", borderRadius: "50%" }}></div>
          </div>
          <div className="skeleton" style={{ width: "60px", height: "36px", marginTop: "10px" }}></div>
        </div>
      </div>

      {/* Table Container Skeleton */}
      <div className="tableContainer">
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="skeleton" style={{ width: "180px", height: "24px" }}></div>
          <div className="skeleton" style={{ width: "110px", height: "36px", borderRadius: "10px" }}></div>
        </div>
        <div
          style={{
            padding: "15px 25px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            gap: "20px",
          }}
        >
          <div className="skeleton" style={{ width: "25%", height: "14px" }}></div>
          <div className="skeleton" style={{ width: "25%", height: "14px" }}></div>
          <div className="skeleton" style={{ width: "20%", height: "14px" }}></div>
          <div className="skeleton" style={{ width: "15%", height: "14px" }}></div>
          <div className="skeleton" style={{ width: "15%", height: "14px" }}></div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeletonRow">
            <div className="skeleton" style={{ width: "25%", height: "18px" }}></div>
            <div className="skeleton" style={{ width: "25%", height: "18px" }}></div>
            <div className="skeleton" style={{ width: "20%", height: "18px" }}></div>
            <div className="skeleton" style={{ width: "15%", height: "18px" }}></div>
            <div className="skeleton" style={{ width: "15%", height: "28px", borderRadius: "6px" }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
