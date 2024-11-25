"use client";

import Link from "next/link";
import "./navbar.css";
import Image from "next/image";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [activeLink, setActiveLink] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { name: "Browse pets", href: "browse-pets" },
    { name: "Foster Pets", href: "foster-pets" },
    { name: "Pet Care", href: "pet-care" },
    { name: "Paltuu AI", href: "llm" },
  ];

  useEffect(() => {
    const currentPath = window.location.pathname.split("/")[1];
    setActiveLink(currentPath);
  }, []);

  return (
    <nav className="navbar">
      <div className="flex items-center justify-between w-full">
        {/* Hamburger menu for small screens */}
        <div className="block md:hidden">
          <button
            className="hamburger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        {/* Logo */}
        <div className="logo">
          <Link href="/">
            <Image src="/paltu_logo.svg" alt="Logo" width={200} height={80} />
          </Link>
        </div>

        {/* Spacer for layout balancing */}
        <div className="hidden md:block flex-grow"></div>

        {/* Desktop navigation links */}
        <div className="navLinks hidden md:flex items-center gap-5">
          {links.map((link) => (
            <Link key={link.href} href={`/${link.href}`}>
              <span
                className={`relative after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#ffd2e3] after:transition-all after:duration-300 hover:after:w-full ${
                  activeLink === link.href ? "after:w-full" : "after:w-0"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setActiveLink(link.href)}
              >
                {link.name}
              </span>
            </Link>
          ))}
          <Link href="/create-user">
            <button className="loginBtn hover:bg-[#ffd2e3] hover:text-[#70223f] transition-all duration-300">
              Login
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`mobile-menu fixed top-0 left-0 h-full w-[80%] bg-[#A03048] text-white transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <button
          className="close-button text-2xl p-4"
          onClick={() => setIsMenuOpen(false)}
        >
          &times;
        </button>
        <div className="flex flex-col gap-4 mt-10 ml-6">
          {links.map((link) => (
            <Link key={link.href} href={`/${link.href}`}>
              <span
                className="text-lg"
                onClick={() => setIsMenuOpen(false)} // Close menu on link click
              >
                {link.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Login button at the bottom */}
        <div className="absolute bottom-6 left-6">
          <Link href="/login">
            <button className="loginBtn hover:bg-[#ffd2e3] hover:text-[#70223f] transition-all duration-300">
              Login
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
