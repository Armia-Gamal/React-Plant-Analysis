import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined); 
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // لسه بنشيك
  if (user === undefined) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: 'var(--color-bg-app, #fff)',
      }}>
        {/* The 'spin' animation is now available from index.html or a global CSS file */}
        <Loader2 size={48} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--color-primary, #16a34a)' }} />
      </div>
    );
  }

  // مش مسجل دخول
    if (!user) {
      return (
        <Navigate
          to="/login"
          replace
          state={{ from: location, notAccess: true }}
        />
      );
    }

  // مسجل دخول
  return children;
}