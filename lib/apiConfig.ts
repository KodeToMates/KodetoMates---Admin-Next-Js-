// Automatically use the live backend in production, and localhost in development.
// You can still override this using the NEXT_PUBLIC_API_BASE_URL environment variable on Vercel.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? "https://kodetomates-backend.onrender.com/api/v1" 
    : "http://localhost:8081/api/v1");

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    me: `${API_BASE_URL}/auth/me`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
    forgotPasswordRequest: `${API_BASE_URL}/auth/forgot-password/request`,
    forgotPasswordReset: `${API_BASE_URL}/auth/forgot-password/reset`,
    mfaSetup: `${API_BASE_URL}/auth/mfa/setup`,
    mfaVerify: `${API_BASE_URL}/auth/mfa/verify`,
  },
  template: {
    base: `${API_BASE_URL}/template`,
    byId: (id: string | number) => `${API_BASE_URL}/template/${id}`,
  },
  iam: {
    users: `${API_BASE_URL}/iam/users`,
    userById: (id: string | number) => `${API_BASE_URL}/iam/users/${id}`,
    profiles: `${API_BASE_URL}/iam/profiles`,
  },
  contact: {
    base: `${API_BASE_URL}/contact`,
    byId: (id: string | number) => `${API_BASE_URL}/contact/${id}`,
  },
  application: {
    base: `${API_BASE_URL}/application`,
    byId: (id: string | number) => `${API_BASE_URL}/application/${id}`,
  },
};
