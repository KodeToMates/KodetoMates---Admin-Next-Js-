"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  lastLoginAt: string;
  accessProfiles: string[];
}

export default function IamPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newAccessProfile, setNewAccessProfile] = useState("");
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [resUsers, resProfiles] = await Promise.all([
        apiClient.get(API_ENDPOINTS.iam.users),
        apiClient.get(API_ENDPOINTS.iam.profiles)
      ]);
      
      if (!resUsers.ok) throw new Error("Failed to fetch users or unauthorized");
      
      const usersData = await resUsers.json();
      setUsers(usersData);
      
      if (resProfiles.ok) {
        const profilesData = await resProfiles.json();
        setAvailableProfiles(profilesData);
        if (profilesData.length > 0) {
          setNewAccessProfile(profilesData[0]);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [router]);

  const handleSaveStatus = async (id: number) => {
    try {
      const res = await apiClient.put(API_ENDPOINTS.iam.userById(id), { status: editStatus });
      if (res.ok) {
        setEditingId(null);
        fetchUsers();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async () => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.iam.users, {
        email: newEmail,
        password: newPassword,
        firstName: newFirstName,
        lastName: newLastName,
        accessProfile: newAccessProfile
      });
      if (res.ok) {
        setIsAddUserModalOpen(false);
        setNewEmail("");
        setNewPassword("");
        setNewFirstName("");
        setNewLastName("");
        // Reset to first available if present
        setNewAccessProfile(availableProfiles.length > 0 ? availableProfiles[0] : "");
        fetchUsers();
      } else {
        alert("Failed to create user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="gridCards">
        <div className="card">
          <div className="cardHeader">
            <span>Total Users</span>
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="cardValue">{loading ? "..." : users.length}</div>
        </div>
        <div className="card">
          <div className="cardHeader">
            <span>Access Profiles</span>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="cardValue">6</div>
        </div>
      </div>

      <div className="tableContainer">
        <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ color: "var(--text-main)", margin: 0 }}>User Entitlements</h3>
          <button className="btn btn-sm" style={{ width: "auto" }} onClick={() => setIsAddUserModalOpen(true)}>
            <i className="fa-solid fa-plus"></i> Add User
          </button>
        </div>
        {error && <div style={{ padding: "20px", color: "#ff4444" }}>{error}</div>}
        
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Access Profiles</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center" }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center" }}>No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{user.email}</div>
                  </td>
                  <td>{user.accessProfiles.join(", ") || "None"}</td>
                  <td>
                    {editingId === user.id ? (
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        style={{ padding: "5px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)" }}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="LOCKED">LOCKED</option>
                      </select>
                    ) : (
                      <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {user.status}
                      </span>
                    )}
                  </td>
                  <td>{user.lastLoginAt}</td>
                  <td>
                    {editingId === user.id ? (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn btn-sm" onClick={() => handleSaveStatus(user.id)}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditingId(user.id); setEditStatus(user.status); }}>
                        <i className="fa-solid fa-pen"></i> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAddUserModalOpen && (
        <div className="modalOverlay">
          <div className="modalContent" style={{ width: "400px" }}>
            <div className="modalHeader">
              <h3 style={{ margin: 0, color: "var(--text-main)" }}>Add New User</h3>
            </div>
            <div className="modalBody" style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>Email</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>First Name</label>
                <input 
                  type="text" 
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>Last Name</label>
                <input 
                  type="text" 
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "var(--text-muted)" }}>Access Profile</label>
                <select 
                  value={newAccessProfile}
                  onChange={(e) => setNewAccessProfile(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-main)" }}
                >
                  <option value="">-- None --</option>
                  {availableProfiles.map(profile => (
                    <option key={profile} value={profile}>{profile}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button className="btn" onClick={handleAddUser}>Create User</button>
                <button className="btn btn-outline" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
