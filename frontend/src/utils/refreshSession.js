export async function refreshSession() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const response = await fetch("http://localhost:4000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      localStorage.clear();
      return false;
    }

    const resData = await response.json();

    localStorage.setItem("token", resData.data.access_token);
    localStorage.setItem("refresh_token", resData.data.refresh_token);
    localStorage.setItem("expires_at", resData.data.expires_at * 1000);

    return true;
  } catch (err) {
    console.error("Refresh session error:", err);
    return false;
  }
}
