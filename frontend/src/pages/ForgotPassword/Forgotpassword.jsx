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


      toast.success("The password reset link has been sent to your email.");
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error("cannot send password reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <form onSubmit={onSubmit} className="forgot-form">
        <img src={assets.profile_icon} alt="" />
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
