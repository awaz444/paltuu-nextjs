"use client";

import Link from "next/link";
import "./navbar.css";
import Image from "next/image";
import { useState,useEffect } from "react";

const Navbar = () => {
    const [activeLink, setActiveLink] = useState("");
  
    const links = [
      { name: "Browse pets", href: "browse-pets" },
      { name: "Foster Pets", href: "foster-pets" },
      { name: "Pet Care", href: "pet-care" },
      { name: "Paltuu AI", href: "llm" },
    ];
  
    useEffect(() => {
      // Set active link based on current path
      const currentPath = window.location.pathname.split('/')[1];
      setActiveLink(currentPath);
    }, []); // Empty dependency array to run once on mount
  
    return (
      <nav className="navbar">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="logo">
              <Image src="/paltu_logo.svg" alt="Logo" width={250} height={100} />
            </div>
          </Link>
  
          <div className="navLinks flex items-center gap-5">
            {links.map((link) => (
              <Link key={link.href} href={`/${link.href}`}>
                <span
                  className={`relative after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#ffd2e3] after:transition-all after:duration-300 hover:after:w-full 
                  ${activeLink === link.href ? "after:w-full" : "after:w-0"}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveLink(link.href)} // Optional: Update active link on click
                >
                  {link.name}
                </span>
              </Link>
            ))}

          <Link href="/login">
            <button
              className="loginBtn hover:bg-[#ffd2e3] hover:text-[#70223f]"
            >
              Login
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
