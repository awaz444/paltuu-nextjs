"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";

const hideNavbarRoutes = [
  "/login",
  "/success",
  "/sign-up",
  "/rescue-register",
  "/partner-signup",
  "/shop-panel",
  "/rescue-panel",
  "/auth",
  "/beta-signup",
  "/forgot-password",
  "/admin-clinics-vets",
];


export default function NavbarWrapper() {
  const pathname = usePathname();
  const isBazaarPage = pathname === "/bazaar";

  // only render navbar if not in hide list
  if (hideNavbarRoutes.includes(pathname)) {
    return null;
  }

  return (
    <div className={isBazaarPage ? "no-navbar-radius" : ""}>
      <Navbar hideCart={true} />
    </div>
  );
}
