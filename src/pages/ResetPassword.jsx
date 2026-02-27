import { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Reset-Password | Nabta-System";
  }, []);

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent successfully.");
      setError("");
    } catch (err) {
      setError("Failed to send reset email.");
      setMessage("");
    }
  };

  return (
    <>
      <section className="Reset-hero">
        <div className="Reset-welcome">
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset link.</p>
        </div>
      </section>

      <div className="Reset-layout">
        <div className="Reset-card">

          <h2>Forgot your password?</h2>

          <label>Email</label>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p style={{ color: "red", fontSize: "13px", marginTop: "10px" }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: "green", fontSize: "13px", marginTop: "10px" }}>
              {message}
            </p>
          )}

          <button
            className="Reset-btn"
            onClick={handleReset}
          >
            Send Reset Link
          </button>

          <div className="Reset-footer">
            Back to login?{" "}
            <span onClick={() => navigate("/")}>Sign in</span>
          </div>

        </div>
      </div>
    </>
  );
}
