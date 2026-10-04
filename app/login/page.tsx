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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.login, { email, password });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();
      
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
        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
    </div>
  );
}
