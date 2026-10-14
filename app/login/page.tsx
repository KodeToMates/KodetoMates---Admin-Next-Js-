"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        throw new Error(data?.message || data?.error || "Invalid email or password");
      }

      // Save the JWT token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email || "");
      localStorage.setItem("firstName", data.firstName || "");
      localStorage.setItem("lastName", data.lastName || "");
      const fullName = ((data.firstName || "") + (data.lastName ? " " + data.lastName : "")).trim();
      localStorage.setItem("userName", fullName || data.email || "Admin User");

      const role = (data.accessProfiles && data.accessProfiles.length > 0)
        ? data.accessProfiles[0]
        : (data.authorities && data.authorities.includes("users:manage") ? "SUPERADMIN" : "User");
      localStorage.setItem("userRole", role);
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
        <Image 
          src="/KM - Logo.png" 
          alt="Kodetomates Logo" 
          className="logoImage"
          width={140}
          height={64}
          loading="lazy"
          style={{ width: "auto" }}
        />
        <h1>Admin Portal</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "10px" }}>
          Sign in to continue
        </p>
      </div>
      
      <form onSubmit={handleLogin} autoComplete="off">
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
                name="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your email"
                required 
              />
            </div>
            <div className="formGroup">
              <label>Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter your password"
                  style={{ paddingRight: "44px" }}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    borderRadius: "4px",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="24" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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
