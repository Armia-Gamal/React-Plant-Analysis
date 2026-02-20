import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}
