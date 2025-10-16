'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // If route changes and we're not already animating
    if (children !== displayChildren && !isAnimating) {
      setIsAnimating(true);
      
      // Wait for exit animation to complete before updating content
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsAnimating(false);
      }, 300); // Match this with your exit animation duration

      return () => clearTimeout(timer);
    }
  }, [children, displayChildren, isAnimating]);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{
        type: 'tween',
        ease: 'easeInOut',
        duration: 0.3
      }}
      className="w-full"
    >
      {displayChildren}
    </motion.div>
  );
}