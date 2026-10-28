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
      <div className="modalContent" style={{ width: "400px", height: "auto" }}>
        <div className="modalHeader">
          <h3 style={{ margin: 0, color: "var(--text-main)" }}>Add New User</h3>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1.2rem",
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
            gap: "15px",
            padding: "20px",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-color)",
                color: "var(--text-main)",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>
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
                  padding: "8px",
                  paddingRight: "40px",
                  borderRadius: "5px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-color)",
                  color: "var(--text-main)",
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
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>
              First Name
            </label>
            <input
              type="text"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              placeholder="First Name"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-color)",
                color: "var(--text-main)",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>
              Last Name
            </label>
            <input
              type="text"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              placeholder="Last Name"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-color)",
                color: "var(--text-main)",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>
              Role
            </label>
            <select
              value={newAccessProfile}
              onChange={(e) => setNewAccessProfile(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-color)",
                color: "var(--text-main)",
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
