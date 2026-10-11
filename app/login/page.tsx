"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [mfaCode, setMfaCode] = useState("");
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload: any = { email, password };
      if (showMfa) {
        payload.mfaCode = parseInt(mfaCode, 10);
      }

      const res = await apiClient.post(API_ENDPOINTS.auth.login, payload);
      
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.mfaRequired) {
          setShowMfa(true);
          throw new Error("MFA Code is required for this account.");
        }
        throw new Error(data?.error || data?.message || "Invalid email or password");
      }

      // Save the JWT token (using localStorage for simplicity in Phase 4)
      localStorage.setItem("token", data.token);
      localStorage.setItem("authorities", JSON.stringify(data.authorities));

      // Redirect to the dashboard
      router.push("/admin/applications");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", width: "100vw" }}>
      <div className="loginScreen">
      <div className="logoContainer">
        <img 
          src="/KM - Logo.png" 
          alt="Kodetomates Logo" 
          className="logoImage"
        />
        <h1>Admin Portal</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "10px" }}>
          Sign in to continue
        </p>
      </div>
      
      <form onSubmit={handleLogin}>
        {error && (
          <div style={{ backgroundColor: "rgba(255, 0, 0, 0.1)", color: "#ff4444", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {!showMfa ? (
          <>
            <div className="formGroup">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
            <div className="formGroup">
              <label>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
          </>
        ) : (
          <div className="formGroup">
            <label>Authenticator Code (6-digit)</label>
            <input 
              type="text" 
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              disabled={isLoading}
              required 
              autoFocus
              placeholder="123456"
              style={{ letterSpacing: "5px", textAlign: "center", fontSize: "1.2rem" }}
            />
          </div>
        )}

        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? "Signing in..." : (showMfa ? "Verify Code" : "Sign In")}
        </button>
      </form>
    </div>
    </div>
  );
}
