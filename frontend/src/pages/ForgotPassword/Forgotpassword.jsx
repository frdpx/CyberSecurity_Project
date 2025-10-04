import { useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import "./Forgotpassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");   
  const [loading, setLoading] = useState(false); 

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return toast.error("Please fill your email");
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:4000/api/password/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: email }), // backend รอ field user_email
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      // ✅ ถ้า backend ส่ง dev_action_link กลับมา (ตอน dev)
      if (data.dev_action_link) {
        toast.info("Dev link generated (check console)");
        console.log("Dev Reset Link:", data.dev_action_link);
      }

      toast.success(data.message || "The password reset link has been sent to your email.");
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Cannot send password reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <form onSubmit={onSubmit} className="forgot-form">
        <img src={assets.logo} alt="" />
        <h2>Forgot Password</h2>
        <p>Please enter your email. We will send you a password reset link.</p>
        <input
          type="email"
          placeholder="your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "sending..." : "password reset link"}
        </button>
      </form>
    </div>
  );
}
