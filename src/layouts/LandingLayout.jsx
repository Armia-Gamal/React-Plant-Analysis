import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import LandingFooter from "../components/LandingFooter";

export default function LandingLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <LandingFooter />
    </>
  );
}