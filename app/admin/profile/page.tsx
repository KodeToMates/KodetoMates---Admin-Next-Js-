"use client";

import { useState } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startMfaSetup = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.mfaSetup, {});
      if (!res.ok) throw new Error("Failed to start MFA setup");
      const data = await res.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.mfaVerify, { code: parseInt(code) });
      if (!res.ok) throw new Error("Invalid MFA code");
      setMessage("MFA is now successfully enabled for your account!");
      setQrCodeUrl(""); // hide the QR code on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>My Profile & Security</h2>
      <p className={styles.description}>Manage your account security and two-factor authentication.</p>

      <div className={styles.card}>
        <h3>Multi-Factor Authentication (MFA)</h3>
        <p>Protect your account by requiring an authenticator code when you sign in.</p>
        
        {error && <div className={styles.errorAlert}>{error}</div>}
        {message && <div className={styles.successAlert}>{message}</div>}

        {!qrCodeUrl ? (
          <button className={styles.btnPrimary} onClick={startMfaSetup} disabled={isLoading}>
            {isLoading ? "Loading..." : "Enable MFA"}
          </button>
        ) : (
          <div className={styles.mfaSetupContainer}>
            <div className={styles.steps}>
              <p><strong>Step 1:</strong> Scan this QR code using Google Authenticator or Authy.</p>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                alt="MFA QR Code" 
                className={styles.qrCode}
              />
              <p>Or manually enter this secret: <code className={styles.secret}>{secret}</code></p>
            </div>
            
            <div className={styles.steps}>
              <p><strong>Step 2:</strong> Enter the 6-digit code from your app to verify.</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input 
                  type="text" 
                  maxLength={6}
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="123456" 
                  className={styles.codeInput}
                />
                <button className={styles.btnPrimary} onClick={verifyMfa} disabled={isLoading || code.length !== 6}>
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
