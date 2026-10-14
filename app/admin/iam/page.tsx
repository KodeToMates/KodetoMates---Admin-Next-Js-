"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

// Lazy-load the heavy Add User modal component only when needed
const AddUserModal = dynamic(() => import("./AddUserModal"), {
  ssr: false,
  loading: () => null,
});

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  lastLoginAt: string;
  accessProfiles: string[];
}

const ITEMS_PER_PAGE = 10;

export default function IamPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  
  // Progressive lazy loading state for large lists
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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
        const profilesData: string[] = await resProfiles.json();
        // Deduplicate roles (e.g. merge "Super Admin" and "SUPERADMIN")
        const seen = new Set<string>();
        const cleaned: string[] = [];
        const hasUpperSuperAdmin = profilesData.includes("SUPERADMIN");

        for (const p of profilesData) {
          const key = p.toLowerCase().replace(/[\s_-]/g, "");
          // Favor SUPERADMIN if both are present
          if (key === "superadmin" && p !== "SUPERADMIN" && hasUpperSuperAdmin) {
            continue;
          }
          if (!seen.has(key)) {
            seen.add(key);
            cleaned.push(p);
          }
        }
        setAvailableProfiles(cleaned);
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

  const visibleUsers = users.slice(0, visibleCount);
  const hasMore = visibleCount < users.length;

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
            <span>Roles</span>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="cardValue">{availableProfiles.length || 3}</div>
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
              <th>Roles</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Shimmer Skeleton Rows for smooth lazy loading feedback
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="skeleton" style={{ width: "140px", height: "16px", marginBottom: "6px" }}></div>
                    <div className="skeleton" style={{ width: "100px", height: "12px" }}></div>
                  </td>
                  <td><div className="skeleton" style={{ width: "90px", height: "16px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "65px", height: "20px", borderRadius: "4px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "110px", height: "14px" }}></div></td>
                  <td><div className="skeleton" style={{ width: "55px", height: "28px", borderRadius: "6px" }}></div></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>No users found.</td></tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{user.email}</div>
                  </td>
                  <td>
                    {user.accessProfiles.map((p) => (p === "SUPERADMIN" ? "Super Admin" : p)).join(", ") || "None"}
                  </td>
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

        {/* Progressive lazy loading load-more footer */}
        {!loading && users.length > ITEMS_PER_PAGE && (
          <div className="lazyLoadFooter">
            <span>
              Showing {Math.min(visibleCount, users.length)} of {users.length} users
            </span>
            {hasMore ? (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              >
                <i className="fa-solid fa-angles-down" style={{ marginRight: "6px" }}></i>
                Load More Users
              </button>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>All users loaded</span>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Lazy-loaded Modal */}
      {isAddUserModalOpen && (
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSuccess={fetchUsers}
          availableProfiles={availableProfiles}
        />
      )}
    </div>
  );
}
