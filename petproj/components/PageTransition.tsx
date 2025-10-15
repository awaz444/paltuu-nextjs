"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setIsExiting(true);
      setTimeout(() => setIsExiting(false), 400); // match animation duration
    };

    window.addEventListener("pageTransitionStart", handleStart);
    return () => window.removeEventListener("pageTransitionStart", handleStart);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
