"use client";

import React, { useState } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableProfiles: string[];
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSuccess,
  availableProfiles,
}: AddUserModalProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newAccessProfile, setNewAccessProfile] = useState(
    availableProfiles.length > 0 ? availableProfiles[0] : ""
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowPassword(false);
    onClose();
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      alert("Please enter email and password");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.iam.users, {
        email: newEmail,
        password: newPassword,
        firstName: newFirstName,
        lastName: newLastName,
        accessProfile: newAccessProfile,
      });
      if (res.ok) {
        setNewEmail("");
        setNewPassword("");
        setShowPassword(false);
        setNewFirstName("");
        setNewLastName("");
        setNewAccessProfile(availableProfiles.length > 0 ? availableProfiles[0] : "");
        onSuccess();
        onClose();
      } else {
        alert("Failed to create user");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred while creating user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modalContent" style={{ width: "420px", height: "auto", borderRadius: "22px" }}>
        <div className="modalHeader">
          <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "1.2rem", fontWeight: 600 }}>Add New User</h3>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1rem",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div
          className="modalBody"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "24px",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-muted)", fontSize: "0.86rem", fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-muted)", fontSize: "0.86rem", fontWeight: 500 }}>
              Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  paddingRight: "44px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--input-bg)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  color: "var(--text-main)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "4px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="24" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-muted)", fontSize: "0.86rem", fontWeight: 500 }}>
              First Name
            </label>
            <input
              type="text"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              placeholder="First Name"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-muted)", fontSize: "0.86rem", fontWeight: 500 }}>
              Last Name
            </label>
            <input
              type="text"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              placeholder="Last Name"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", color: "var(--text-muted)", fontSize: "0.86rem", fontWeight: 500 }}>
              Role
            </label>
            <select
              value={newAccessProfile}
              onChange={(e) => setNewAccessProfile(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            >
              <option value="">-- None --</option>
              {availableProfiles.map((profile) => (
                <option key={profile} value={profile}>
                  {profile === "SUPERADMIN" ? "Super Admin" : profile}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="btn" onClick={handleAddUser} disabled={submitting}>
              {submitting ? "Creating..." : "Create User"}
            </button>
            <button className="btn btn-outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
