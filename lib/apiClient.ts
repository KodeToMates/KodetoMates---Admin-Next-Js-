export const apiClient = {
  async get(url: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },

  async post(url: string, payload: any) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
  },

  async put(url: string, payload?: any) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (payload) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, {
      method: "PUT",
      headers,
      body: payload ? JSON.stringify(payload) : undefined
    });
  },

  async delete(url: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return fetch(url, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
};
