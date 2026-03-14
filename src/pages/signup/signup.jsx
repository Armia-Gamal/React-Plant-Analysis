import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";
import { auth, googleProvider, db, functions } from "../../firebase";
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

          <button
            type="button"
            className="signup-google-btn"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="20"
              height="20"
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.89 2.3 30.34 0 24 0 14.62 0 6.54 5.48 2.63 13.44l8.04 6.24C12.4 13.02 17.72 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.66-.15-3.26-.42-4.8H24v9.1h12.7c-.55 2.96-2.22 5.47-4.73 7.15l7.27 5.65C43.95 37.7 46.5 31.7 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.67 28.68a14.6 14.6 0 010-9.36l-8.04-6.24A23.97 23.97 0 000 24c0 3.86.92 7.52 2.63 10.92l8.04-6.24z"/>
              <path fill="#34A853" d="M24 48c6.34 0 11.66-2.1 15.55-5.73l-7.27-5.65c-2.02 1.35-4.62 2.15-8.28 2.15-6.28 0-11.6-3.52-13.33-8.68l-8.04 6.24C6.54 42.52 14.62 48 24 48z"/>
            </svg>
            Sign up with Google
          </button>

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
