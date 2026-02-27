import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";
import { auth, googleProvider, db, functions } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Sign Up | Nabta-System";
  }, []);

  const sendEmail = httpsCallable(functions, "sendWelcomeEmail");

  // ===============================
  // 🟢 Email Signup
  // ===============================
  const handleSignup = async () => {
    try {
      setLoading(true);
      setError("");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      // 🔥 إنشاء document في Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: new Date(),
      });

      // 🔥 إرسال الإيميل
      await sendEmail({
        email,
        name,
      });

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🔵 Google Signup
  // ===============================
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || "Google User",
        email: user.email,
        createdAt: new Date(),
      });

      await sendEmail({
        email: user.email,
        name: user.displayName || "Google User",
      });

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <>
      <section className="signup-hero">
        <div className="signup-welcome">
          <h1>Welcome!</h1>
          <p>
          Register now to detect plant diseases quickly and accurately using our AI-powered system for healthier crops.
          </p>
        </div>
      </section>

      <div className="signup-layout">
        <div className="signup-card">
          <h2>Register with</h2>

          <div className="signup-social">
            <i className="fa-brands fa-facebook-f"></i>
            <i className="fa-brands fa-apple"></i>
            <i
              className="fa-brands fa-google"
              onClick={handleGoogleSignup}
              style={{ cursor: "pointer" }}
            ></i>
          </div>

          <div className="signup-divider">
            <span>Or</span>
          </div>

          <label>Name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <div className="signup-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <i
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>


          {error && (
            <p style={{ color: "red", fontSize: "13px", marginTop: "10px" }}>
              {error}
            </p>
          )}

          <button
            className="signup-btn"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <div className="signup-footer">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign In</span>
          </div>
        </div>
      </div>
    </>
  );
}
