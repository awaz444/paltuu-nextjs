'use client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const hideFooterRoutes = ["/login", "/sign-up", "/vet-register", "/vet-qualifications", "/vet-specialization" , "/vet-schedule", "/vet-get-verified-1", "/vet-get-verified-2"];
  const pathName = usePathname();

  
  // Update the year unconditionally
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Determine if the footer should be hidden
  const isHideFooter = hideFooterRoutes.includes(pathName);

  // Conditional rendering for the footer
  if (isHideFooter) {
    return null;
  }

  return (
    <footer className="text-white p-6 rounded-t-[3rem] rounded-b-none bg-primary">
      <div className="container mx-auto text-center">
        <div className="mb-4">
          <Image src="/paltu_logo.svg" alt="Logo" className="mx-auto" width={250} height={100} />
        </div>
        <div className="mb-4">
          <p>Follow us on Instagram</p>
          <a href="https://instagram.com/paltuu.pk" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
            @paltuu.pk
          </a>
        </div>
        <div className="mb-4">
          { /* for about us */ }
        </div>
        <p className="text-sm">&copy; {currentYear} Paltuu. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
