// components/Footer.tsx
'use client'; // Marking this as a client component

import React, { useEffect, useState } from 'react';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="text-white p-6 rounded-t-[3rem] rounded-b-none" style={{backgroundColor:'#A03048'}}>
      <div className="container mx-auto text-center">
        <div className="mb-4">
          <img src="/paltu_logo.svg" alt="Logo" className="mx-auto" width={250} />
        </div>
        <div className="mb-4">
          <p>Follow us on Instagram</p>
          <a href="https://instagram.com/paltuu.pk" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            @paltuu.pk
          </a>
        </div>
        <p className="text-sm">&copy; {currentYear} Paltuu. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
