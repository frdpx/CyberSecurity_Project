import React, { useState } from "react";
import { toast } from "react-toastify";
import eye from "../../assets/eye.png";
import eyeclose from "../../assets/eyeclose.png";
import "./ForceChangePasswordPopup.css"; // ใช้ CSS ของ popup ใหม่

const ForceChangePasswordPopup = ({ setForcePasswordChange, setShowLogin }) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const [data, setData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain a lowercase letter";
    if (!(/(?=.*[A-Z])/.test(password))) return "Password must contain an uppercase letter";
    if (!(/(?=.*\d)/.test(password))) return "Password must contain a number";
    return "Strong";
  };

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (name === "newPassword") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordStrength !== "Strong") {
      toast.error(
        "New password must include uppercase, lowercase, number, and be at least 6 characters"
      );
      return;
    }
    if (data.newPassword !== data.confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:4000/api/force/force-password-change",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
          }),
        }
      );

      const resData = await response.json();
      console.log("Force password change response:", resData);

      if (resData.success) {
        toast.success("Password changed successfully! Please log in again.");
        localStorage.removeItem("token");
        setForcePasswordChange(false);
        setShowLogin(false);
        setShowLogin(true); // แสดง login หลังเปลี่ยน password
      } else {
        toast.error(resData.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="force-password-popup">
      <div className="force-password-content">
        <div className="popup-header">
          <h3>Password Expired</h3>
          <img
            onClick={() => {
              setForcePasswordChange(false);
              setShowLogin(false);
            }}
            src="/src/assets/cross_icon.png"
            alt="close"
            className="close-icon"
          />
        </div>

        <p className="popup-msg">Please change your password!</p>

        <div className="popup-inputs">
          <div className="password-input-container">
            <input
              name="oldPassword"
              value={data.oldPassword}
              onChange={onChangeHandler}
              type={showOldPassword ? "text" : "password"}
              placeholder="Old Password"
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute("readonly")}
              required
            />
            <img
              src={showOldPassword ? eye : eyeclose}
              alt="toggle"
              className="password-toggle-icon"
              onClick={() => setShowOldPassword(!showOldPassword)}
            />
          </div>

          <div className="password-input-container">
            <input
              name="newPassword"
              value={data.newPassword}
              onChange={onChangeHandler}
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              required
            />
            <img
              src={showNewPassword ? eye : eyeclose}
              alt="toggle"
              className="password-toggle-icon"
              onClick={() => setShowNewPassword(!showNewPassword)}
            />
          </div>

          <div className="password-input-container">
            <input
              name="confirmNewPassword"
              value={data.confirmNewPassword}
              onChange={onChangeHandler}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              required
            />
            <img
              src={showConfirmPassword ? eye : eyeclose}
              alt="toggle"
              className="password-toggle-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>

          <div className="password-rules">
          <p className="rules-title">Password must contain</p>
          <ul className="rules-list">
            <li>At least 6 characters</li>
            <li>Lowercase letter (a–z)</li>
            <li>Uppercase letter (A–Z)</li>
            <li>Number (0–9)</li>
          </ul>
        </div>


        </div>

        <button onClick={handleForcePasswordChange} disabled={loading}>
          {loading ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div>
  );
};

export default ForceChangePasswordPopup;
