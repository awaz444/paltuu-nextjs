"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";

const hideNavbarRoutes = [
  "/login",
  "/success",
  "/sign-up",
  "/vet-register",
  "/rescue-register",
  "/vet-qualifications",
  "/vet-specialization",
  "/vet-schedule",
  "/vet-reviews-summary",
  "/vet-get-verified-1",
  "/vet-get-verified-2",
  "/partner-signup",
  "/vet-panel",
  "/shop-panel",
  "/rescue-panel",
  "/auth",
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
      <Navbar />
    </div>
  );
}
