'use client';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const hideFooterRoutes = ["/login", "/success", "/sign-up", "/vet-register", "/rescue-register", "/vet-qualifications", "/vet-specialization" , "/vet-schedule", "/vet-get-verified-1", "/vet-get-verified-2", '/'];
  const pathName = usePathname();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const isHideFooter = hideFooterRoutes.includes(pathName);

  if (isHideFooter) {
    return null;
  }

  return (
    <footer className="text-white py-3 px-4 rounded-t-[3rem] rounded-b-none bg-primary mt-8">
      <div className="container mx-auto text-center">
        <div className="mb-2">
          <Image src="/paltu_logo.svg" alt="Logo" className="mx-auto" width={180} height={70} />
        </div>
        <div className="mb-2">
          <p className="text-sm">Follow us on Instagram</p>
          <a href="https://instagram.com/paltuupk" target="_blank" rel="noopener noreferrer" className="text-white hover:underline text-sm">
            @paltuupk
          </a>
        </div>
        <p className="text-xs">&copy; {currentYear} Paltuu. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;