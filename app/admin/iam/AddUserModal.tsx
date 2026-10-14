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
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newAccessProfile, setNewAccessProfile] = useState(
    availableProfiles.length > 0 ? availableProfiles[0] : ""
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modalContent" style={{ width: "400px", height: "auto" }}>
        <div className="modalHeader">
          <h3 style={{ margin: 0, color: "var(--text-main)" }}>Add New User</h3>
          <button
            onClick={onClose}
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
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
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
            <button className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
