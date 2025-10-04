import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import eyeclose from "../assets/eyeclose.png";
import eye from "../assets/eye.png";
import "./ResetPassword.css";

// เปลี่ยนให้ตรงกับ backend ของคุณ
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function getTokenFromUrl() {
  // 1) ลองอ่านจาก hash (#access_token=...&type=recovery)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hashToken = hash.get("access_token");

  // 2) ถ้าไม่มีใน hash ลองอ่านจาก query (?access_token=... หรือ ?token=...&type=recovery)
  const qs = new URLSearchParams(window.location.search);
  const qsAccess = qs.get("access_token");
  const qsToken = qs.get("token");
  const qsType = qs.get("type");

  // ลำดับความสำคัญ: hash > query access_token > token(type=recovery)
  if (hashToken) return hashToken;
  if (qsAccess) return qsAccess;
  if (qsToken && (qsType === "recovery" || !qsType)) return qsToken;
  return null;
}

export default function ResetPassword() {
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false); 
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ดึง access_token จาก URL
  const accessToken = useMemo(getTokenFromUrl, []);
  useEffect(() => {
    if (!accessToken) {
      toast.error("Invalid or missing token. Open the link from your email again.");
    }
  }, [accessToken]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validatePassword = (password) => {
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain a lowercase letter";
    if (!(/(?=.*[A-Z])/.test(password))) return "Password must contain an uppercase letter";
    if (!(/(?=.*\d)/.test(password))) return "Password must contain a number";
    return null;
  };

  const onSubmit = async () => {
    if (!accessToken) {
      toast.error("Missing token. Please use the reset link from your email.");
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      return toast.error("Please fill in all fields");
    }
    const passwordError = validatePassword(formData.password);
    if (passwordError) return toast.error(passwordError);
    if (formData.password !== formData.confirmPassword) {
      return toast.error("New password and confirm password do not match");
    }

    try {
      setLoading(true);

      const resp = await fetch(`${API_BASE}/api/password/reset-password-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: formData.password,
          access_token: accessToken,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        toast.error(data?.error || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      setFormData({ password: "", confirmPassword: "" });
      // ไปหน้า login ถ้าต้องการ
      // window.location.href = "/login";
    } catch (err) {
      console.error(err);
      toast.error("Cannot change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setpass-container">
      <div className="setpass-form">
        <img src={assets.logo} alt="" />
        <h2 className="setpass-title">Reset Password</h2>

        <div className="input-group">
          <label className="label">New Password</label>
          <div className="password-container">
            <input
              type={showPass ? "text" : "password"}
              name="password"
              placeholder="******"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
            <img
              src={showPass ? eye : eyeclose}
              alt="Toggle visibility"
              className="toggle-visibility"
              onClick={() => setShowPass(!showPass)} 
            />
          </div>
        </div>

        <div className="input-group">
          <label className="label">Confirm Password</label>
          <div className="password-container">
            <input
              type={showConfirmPass ? "text" : "password"}
              name="confirmPassword"
              placeholder="******"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              required
            />
             <img
              src={showConfirmPass ? eye : eyeclose}
              alt="toggle visibility"
              className="toggle-eye"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
            />
          </div>
        </div>

        <div className="password-rules">
          <p className="rules-title">Password must contain:</p>
          <ul className="rules-list">
            <li>At least 6 characters</li>
            <li>Lowercase letter (a–z)</li>
            <li>Uppercase letter (A–Z)</li>
            <li>Number (0–9)</li>
          </ul>
        </div>

        <button onClick={onSubmit} disabled={loading || !accessToken}
          className={`submit-button ${loading ? "is-loading" : ""}`}>
          {loading ? "Changing password..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}
