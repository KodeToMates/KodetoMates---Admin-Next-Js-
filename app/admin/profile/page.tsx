"use client";

import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { apiClient } from "@/lib/apiClient";
import styles from "./profile.module.css";

interface UserProfile {
  id?: string | number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  accessProfiles: string[];
  isMfaEnabled?: boolean;
  lastLoginAt?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Forgot Password via Email OTP State
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // MFA Setup State
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [mfaMessage, setMfaMessage] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [isMfaLoading, setIsMfaLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsProfileLoading(true);
    setProfileError("");
    try {
      const res = await apiClient.get(API_ENDPOINTS.auth.me);
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
      } else {
        // Fallback to localStorage data if endpoint fails
        const localEmail = localStorage.getItem("email") || "admin@example.com";
        const localFirst = localStorage.getItem("firstName") || "Admin";
        const localLast = localStorage.getItem("lastName") || "User";
        const localRole = localStorage.getItem("userRole") || "Super Admin";
        setProfile({
          email: localEmail,
          firstName: localFirst,
          lastName: localLast,
          status: "ACTIVE",
          accessProfiles: [localRole],
        });
        setFirstName(localFirst);
        setLastName(localLast);
      }
    } catch (err: any) {
      setProfileError("Could not load profile details: " + err.message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    try {
      // Primary: PUT /api/v1/auth/me
      let res = await apiClient.put(API_ENDPOINTS.auth.me, { firstName, lastName });

      // Fallback 1: If 405 Method Not Allowed, try POST /api/v1/auth/me
      if (res.status === 405) {
        res = await apiClient.post(API_ENDPOINTS.auth.me, { firstName, lastName });
      }

      // Fallback 2: If still 405 and profile ID exists, try PUT /api/v1/iam/users/{id}
      if (res.status === 405 && profile?.id) {
        res = await apiClient.put(API_ENDPOINTS.iam.userById(profile.id), { firstName, lastName });
      }

      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...updated, firstName, lastName } : updated));
        const fullName = `${updated.firstName || firstName} ${updated.lastName || lastName}`.trim();
        localStorage.setItem("firstName", updated.firstName || firstName);
        localStorage.setItem("lastName", updated.lastName || lastName);
        localStorage.setItem("userName", fullName || updated.email || "Admin User");
        setProfileMessage("Profile updated successfully!");
        // Notify components like TopHeader
        window.dispatchEvent(new Event("storage"));
      } else {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || "Failed to update profile. Please ensure the backend server has been restarted.");
      }
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill out all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.changePassword, {
        currentPassword,
        newPassword,
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setPasswordMessage("Password changed successfully! You can now use your new password.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(data?.error || data?.message || "Failed to change password");
      }
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestResetCode = async () => {
    setIsRequestingCode(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.forgotPasswordRequest, {
        email: profile?.email,
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setCodeSent(true);
        setPasswordMessage(data?.message || `A 6-digit reset code has been sent to ${profile?.email}.`);
      } else {
        throw new Error(data?.error || data?.message || "Failed to send reset code");
      }
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!resetCode.trim()) {
      setPasswordError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setPasswordError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setIsResettingPassword(true);

    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.forgotPasswordReset, {
        email: profile?.email,
        resetCode: resetCode.trim(),
        newPassword,
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setPasswordMessage(data?.message || "Password successfully reset! You can now use your new password.");
        setResetCode("");
        setNewPassword("");
        setConfirmPassword("");
        setCodeSent(false);
        setIsForgotMode(false);
      } else {
        throw new Error(data?.error || data?.message || "Failed to reset password");
      }
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const startMfaSetup = async () => {
    setIsMfaLoading(true);
    setMfaError("");
    setMfaMessage("");
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.mfaSetup, {});
      if (!res.ok) throw new Error("Failed to start MFA setup");
      const data = await res.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
    } catch (err: any) {
      setMfaError(err.message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const verifyMfa = async () => {
    setIsMfaLoading(true);
    setMfaError("");
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.mfaVerify, { code: parseInt(code) });
      if (!res.ok) throw new Error("Invalid MFA code. Please enter the latest 6-digit code.");
      setMfaMessage("MFA is now successfully enabled and protecting your account!");
      setQrCodeUrl("");
      if (profile) {
        setProfile({ ...profile, isMfaEnabled: true });
      }
    } catch (err: any) {
      setMfaError(err.message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const userInitial = (firstName || profile?.email || "U").charAt(0).toUpperCase();
  const displayRole = profile?.accessProfiles && profile.accessProfiles.length > 0
    ? (profile.accessProfiles[0] === "SUPERADMIN" ? "Super Admin" : profile.accessProfiles[0])
    : "Super Admin";

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h2>User Settings</h2>
        <p className={styles.description}>Manage your personal identity details, security credentials, and authentication preferences.</p>
      </div>

      <div className={styles.cardsStack}>
        {/* Card 1: Account & Profile Details */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <i className="fa-solid fa-id-card"></i> My Account Details
              </div>
              <div className={styles.cardSubtitle}>Your personal profile and role assignments in this portal</div>
            </div>
            <span className={`badge ${profile?.status === "ACTIVE" ? "badge-success" : "badge-warning"}`}>
              {profile?.status || "ACTIVE"}
            </span>
          </div>

          {profileError && (
            <div className={styles.errorAlert}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              {profileError}
            </div>
          )}

          {profileMessage && (
            <div className={styles.successAlert}>
              <i className="fa-solid fa-circle-check"></i>
              {profileMessage}
            </div>
          )}

          {isProfileLoading ? (
            <div>
              <div className="skeleton" style={{ width: "200px", height: "30px", marginBottom: "15px" }}></div>
              <div className="skeleton" style={{ width: "100%", height: "45px", marginBottom: "15px" }}></div>
            </div>
          ) : (
            <>
              <div className={styles.profileSummary}>
                <div className={styles.largeAvatar}>{userInitial}</div>
                <div className={styles.profileMeta}>
                  <div className={styles.profileName}>{firstName} {lastName}</div>
                  <div className={styles.profileEmail}>{profile?.email}</div>
                  <div className={styles.badgeRow}>
                    <span className="badge badge-success">
                      <i className="fa-solid fa-shield-halved" style={{ marginRight: "4px" }}></i>
                      {displayRole}
                    </span>
                    {profile?.isMfaEnabled && (
                      <span className="badge badge-success">
                        <i className="fa-solid fa-lock" style={{ marginRight: "4px" }}></i> 2FA Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      readOnly
                      disabled
                      className={`${styles.inputField} ${styles.inputFieldReadOnly}`}
                      title="Email address cannot be changed directly"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Assigned Role</label>
                    <input
                      type="text"
                      value={displayRole}
                      readOnly
                      disabled
                      className={`${styles.inputField} ${styles.inputFieldReadOnly}`}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className={styles.inputField}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.btnPrimary} disabled={isSavingProfile}>
                    <i className="fa-solid fa-floppy-disk" style={{ marginRight: "8px" }}></i>
                    {isSavingProfile ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Card 2: Reset & Change Password */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <i className="fa-solid fa-key"></i> Change / Reset Password
              </div>
              <div className={styles.cardSubtitle}>Ensure your account uses a strong, private password of at least 6 characters</div>
            </div>
          </div>

          {passwordError && (
            <div className={styles.errorAlert}>
              <i className="fa-solid fa-circle-exclamation"></i>
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div className={styles.successAlert}>
              <i className="fa-solid fa-circle-check"></i>
              {passwordMessage}
            </div>
          )}

          {isForgotMode ? (
            <div>
              <div className={styles.forgotPasswordBanner}>
                <div className={styles.forgotPasswordInfo}>
                  <i className="fa-solid fa-envelope-circle-check"></i>
                  <div>
                    <strong style={{ display: "block" }}>Forgot your current password?</strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Reset your password with a 6-digit verification code sent to <strong>{profile?.email}</strong>.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => {
                    setIsForgotMode(false);
                    setCodeSent(false);
                    setResetCode("");
                    setPasswordError("");
                    setPasswordMessage("");
                  }}
                >
                  <i className="fa-solid fa-arrow-left"></i> Standard Password Change
                </button>
              </div>

              {!codeSent ? (
                <div style={{ padding: "8px 0" }}>
                  <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "0.95rem", lineHeight: "1.6" }}>
                    Don't remember your current password? No problem. Click the button below to generate a secure 6-digit OTP code sent directly to your registered email address (<strong>{profile?.email}</strong>). The code remains valid for 15 minutes.
                  </p>
                  <div className={styles.formActions} style={{ justifyContent: "flex-start", gap: "12px" }}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={handleRequestResetCode}
                      disabled={isRequestingCode}
                    >
                      <i className={`fa-solid ${isRequestingCode ? "fa-spinner fa-spin" : "fa-paper-plane"}`} style={{ marginRight: "8px" }}></i>
                      {isRequestingCode ? "Sending Reset Code..." : "Send Reset Code to My Email"}
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => {
                        setIsForgotMode(false);
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordWithOtp}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                      <label>6-Digit Verification Code</label>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          maxLength={6}
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 123456"
                          className={styles.inputField}
                          style={{ letterSpacing: "4px", fontWeight: "600", fontSize: "1.1rem", maxWidth: "240px" }}
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={handleRequestResetCode}
                          disabled={isRequestingCode}
                          title="Resend verification code to your email"
                        >
                          <i className={`fa-solid ${isRequestingCode ? "fa-spinner fa-spin" : "fa-rotate-right"}`}></i>
                          {isRequestingCode ? "Resending..." : "Resend Code"}
                        </button>
                      </div>
                      <small style={{ color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                        A 6-digit OTP code was sent to <strong>{profile?.email}</strong>. Please check your inbox and spam folder.
                      </small>
                    </div>

                    <div className={styles.formGroup}>
                      <label>New Password</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className={styles.inputField}
                          style={{ paddingRight: "40px" }}
                          required
                        />
                        <button
                          type="button"
                          className={styles.passwordToggleBtn}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex={-1}
                        >
                          <i className={`fa-solid ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Confirm New Password</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className={styles.inputField}
                          style={{ paddingRight: "40px" }}
                          required
                        />
                        <button
                          type="button"
                          className={styles.passwordToggleBtn}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => {
                        setIsForgotMode(false);
                        setCodeSent(false);
                        setResetCode("");
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                      disabled={isResettingPassword || resetCode.length !== 6}
                    >
                      <i className={`fa-solid ${isResettingPassword ? "fa-spinner fa-spin" : "fa-circle-check"}`} style={{ marginRight: "8px" }}></i>
                      {isResettingPassword ? "Verifying & Resetting..." : "Verify Code & Reset Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleChangePassword}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ margin: 0 }}>Current Password</label>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => {
                        setIsForgotMode(true);
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                    >
                      <i className="fa-solid fa-circle-question"></i> Forgot password?
                    </button>
                  </div>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className={styles.inputField}
                      style={{ paddingRight: "40px" }}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showCurrentPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className={styles.inputField}
                      style={{ paddingRight: "40px" }}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Confirm New Password</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className={styles.inputField}
                      style={{ paddingRight: "40px" }}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary} disabled={isChangingPassword}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: "8px" }}></i>
                  {isChangingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Card 3: Two-Factor Authentication (MFA) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <i className="fa-solid fa-mobile-screen-button"></i> Two-Factor Authentication (2FA / MFA)
              </div>
              <div className={styles.cardSubtitle}>Require a 6-digit verification code from Google Authenticator or Authy when signing in</div>
            </div>
          </div>

          {mfaError && (
            <div className={styles.errorAlert}>
              <i className="fa-solid fa-circle-exclamation"></i>
              {mfaError}
            </div>
          )}

          {mfaMessage && (
            <div className={styles.successAlert}>
              <i className="fa-solid fa-circle-check"></i>
              {mfaMessage}
            </div>
          )}

          {profile?.isMfaEnabled && !qrCodeUrl ? (
            <div style={{ color: "#34d399", display: "flex", alignItems: "center", gap: "10px", padding: "10px 0" }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: "1.3rem" }}></i>
              <span>Two-factor authentication is active and protecting your account.</span>
            </div>
          ) : !qrCodeUrl ? (
            <div>
              <p style={{ color: "var(--text-muted)", marginBottom: "15px", lineHeight: "1.5" }}>
                Add an extra layer of security to prevent unauthorized access even if your password is compromised.
              </p>
              <button className={styles.btnPrimary} onClick={startMfaSetup} disabled={isMfaLoading}>
                <i className="fa-solid fa-qrcode" style={{ marginRight: "8px" }}></i>
                {isMfaLoading ? "Generating QR Code..." : "Setup Two-Factor Authentication"}
              </button>
            </div>
          ) : (
            <div className={styles.mfaSetupContainer}>
              <div className={styles.steps}>
                <p><strong>Step 1:</strong> Scan this QR code using Google Authenticator, Microsoft Authenticator, or Authy.</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                  alt="MFA QR Code"
                  className={styles.qrCode}
                  loading="lazy"
                  decoding="async"
                />
                <p>Or enter this secret key manually: <code className={styles.secret}>{secret}</code></p>
              </div>

              <div className={styles.steps}>
                <p><strong>Step 2:</strong> Enter the 6-digit verification code from your authenticator app.</p>
                <div style={{ display: "flex", gap: "12px", marginTop: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className={styles.codeInput}
                  />
                  <button className={styles.btnPrimary} onClick={verifyMfa} disabled={isMfaLoading || code.length !== 6}>
                    {isMfaLoading ? "Verifying..." : "Verify & Activate"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
