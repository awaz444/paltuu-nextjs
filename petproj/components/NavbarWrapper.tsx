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

];

export default function NavbarWrapper() {
  const pathname = usePathname();

  // only render navbar if not in hide list
  if (hideNavbarRoutes.includes(pathname)) {
    return null;
  }

  return <Navbar />;
}
