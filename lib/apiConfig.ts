const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
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
