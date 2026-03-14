import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import LandingFooter from "../LandingFooter/LandingFooter";

export default function LandingLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <LandingFooter />
    </>
  );
}