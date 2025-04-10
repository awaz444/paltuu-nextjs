'use client';
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSetPrimaryColor } from "./hooks/useSetPrimaryColor";
import HeroSection from "../components/HeroSection";

export default function PetShopLandingPage() {
  return (
    <main className="overflow-hidden bg-white">
      <HeroSection />
    </main>
  );
}
