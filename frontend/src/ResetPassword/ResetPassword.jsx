import { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import "./ResetPassword.css";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validatePassword = (password) => {
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[a-z])/.test(password)) return "password must contain a lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "password must contain an uppercase letter";
    if (!/(?=.*\d)/.test(password)) return "password must contain a number";
    return null;
  };

  const onSubmit = async () => {
    if (!formData.password || !formData.confirmPassword) {
      return toast.error("Please fill in all fields");
    }
    const passwordError = validatePassword(formData.password);
    if (passwordError) return toast.error(passwordError);
    if (formData.password !== formData.confirmPassword) {
      return toast.error("new password and confirm password do not match");
    }

    try {
      setLoading(true);
      // จำลองเรียก API
      await new Promise((r) => setTimeout(r, 2000));
      const mockSuccess = Math.random() > 0.2;
      if (mockSuccess) {
        toast.success("Password changed successfully");
        setFormData({ password: "", confirmPassword: "" });
        // window.location.href = "/login";
      } else {
        toast.error("failed to change password");
      }
    } catch (err) {
      console.error(err);
      toast.error("cannot change password");
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
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="******"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />

          </div>
        </div>

        <div className="input-group">
          <label className="label">Confirm Password</label>
          <div className="password-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="******"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              required
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

        <button
          onClick={onSubmit}
          disabled={loading}
          className={`submit-button ${loading ? "is-loading" : ""}`}
        >
          {loading ? "changing password..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}
