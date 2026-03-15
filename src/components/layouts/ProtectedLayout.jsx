import Footer from "../Footer/Footer";
import { Outlet, useLocation } from "react-router-dom";

export default function ProtectedLayout() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith("/dashboard");

  return (
    <>
      <Outlet />
      {!hideFooter && <Footer />}
    </>
  );
}
