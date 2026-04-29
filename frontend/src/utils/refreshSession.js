import axiosInstance from "./axiosInstance";

export async function refreshSession() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const response = await axiosInstance.post("/api/auth/refresh", {
      refresh_token: refreshToken
    });

    const resData = response.data;

    localStorage.setItem("token", resData.data.access_token);
    localStorage.setItem("refresh_token", resData.data.refresh_token);
    localStorage.setItem("expires_at", resData.data.expires_at * 1000);

    return true;
  } catch (err) {
    console.error("Refresh session error:", err);
    localStorage.clear();
    return false;
  }
}
