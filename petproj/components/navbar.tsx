"use client";

import Link from "next/link";
import "./navbar.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import "bootstrap-icons/font/bootstrap-icons.css";


const Navbar = () => {
    const [activeLink, setActiveLink] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    let hideTimeout: ReturnType<typeof setTimeout>;
    const [isVerified, setIsVerified] = useState<boolean | null>(null);

    const handleMouseEnter = () => {
        clearTimeout(hideTimeout); // Cancel the hide timeout
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        hideTimeout = setTimeout(() => setIsDropdownOpen(false), 200);
    };

    // Use next-auth's useSession hook for Google login
    const { data: session, status } = useSession();

    // Use custom AuthContext for API-based login
    const { isAuthenticated, user, logout: apiLogout } = useAuth();

    const router = useRouter(); // Router for navigation

    const handleLogout = async () => {
        if (user?.method === "google") {
            await signOut({ callbackUrl: "/login" });
        } else {
            apiLogout();
            router.push("/login");
        }
    };

    type UserRole = "guest" | "regular user" | "vet" | "admin";

    const navbarBackground: Record<UserRole, string> = {
        guest: "#A03048",
        "regular user": "#A03048",
        vet: "#480777",
        admin: "#065758",
    };

    const buttonTextColor: Record<UserRole, string> = {
        guest: "#ffffff",
        "regular user": "#ffffff",
        vet: "#ffffff",
        admin: "#ffffff",
    };

    const arrowColor: Record<UserRole, string> = {
        guest: "#ffd2e3",
        "regular user": "#ffd2e3",
        vet: "#e0c3f7",
        admin: "#7fe1d3",
    };

    // Calculate dropdown width dynamically
    const dropdownItems = [
        { href: "/profile", label: "My Profile" },
        { href: "/my-listings", label: "My Listings" },
        { href: "/my-applications", label: "My Applications" },
        { href: "/notifications", label: "Notifications" },
        { href: "/logout", label: "Logout" },
    ];

    const userRole: UserRole =
        (user?.role as UserRole) ||
        (session?.user?.role as UserRole) ||
        "guest";

    const navbarStyle = { backgroundColor: navbarBackground[userRole] };

    const displayName =
        session?.user?.name ||
        session?.user?.email ||
        user?.name ||
        user?.email ||
        "User";

    // Log the auth context props as soon as they are fetched
    useEffect(() => {
        console.log("AuthContext - User:", user);
        console.log("AuthContext - Role:", userRole);
        console.log("AuthContext - isAuthenticated:", isAuthenticated);
        console.log("NextAuth - Session:", session);
    }, [user, isAuthenticated, session]); // Logs when these values update

    // Navigation Links
    const links = [
        { name: "Browse pets", href: "browse-pets" },
        { name: "Foster Pets", href: "foster-pets" },
        { name: "Pet Care", href: "pet-care" },
        { name: "Lost & Found", href: "lost-and-found" },
        { name: "Paltuu AI", href: "llm" },
    ];


    useEffect(() => {
        const fetchVerificationStatus = async () => {
            if (userRole === "vet" && user?.id) {
                console.log(user.id);
                try {
                    const response = await fetch(`/api/is-verified-by-user-id/${user.id}`);
                    const data = await response.json();
                    console.log("gagea", data);
                    setIsVerified(data.profile_verified); // assuming the response contains an 'isVerified' boolean
                    console.log("Verified", data.profile_verified)
                } catch (error) {
                    console.error("Failed to fetch verification status:", error);
                }
            }
        };

        fetchVerificationStatus();
    }, [userRole, user?.id]);

    useEffect(() => {
        const currentPath = window.location.pathname.split("/")[1];
        setActiveLink(currentPath);
    }, []);

    const dropdownWidth = `${Math.max(
        displayName.length,
        ...dropdownItems.map((item) => item.label.length)
    ) *
        10 +
        50
        }px`;

    return (
        <nav className="navbar" style={navbarStyle}>
            {/* Hamburger Menu Button (Mobile Only) */}
<button
  className="hamburger md:hidden"
  onClick={() => setIsMenuOpen(!isMenuOpen)}
>
  <div className="hamburger-line" />
  <div className="hamburger-line" />
  <div className="hamburger-line" />
</button>

{/* Mobile Menu */}
<div
  className={`mobile-menu ${isMenuOpen ? "open" : ""} md:hidden`}
  style={{ backgroundColor: navbarBackground[userRole] }}
>
  {/* Close Button */}
  <button
    className="close-button"
    onClick={() => setIsMenuOpen(false)}
  >
    &times;
  </button>

  {/* Navigation Links */}
  <div className="navLinks-mobile">
    {links.map((link) => (
      <Link key={link.href} href={`/${link.href}`}>
        <span
          className={`mobile-link ${activeLink === link.href ? "active" : ""}`}
          onClick={() => {
            setActiveLink(link.href);
            setIsMenuOpen(false);
          }}
        >
          {link.name}
        </span>
      </Link>
    ))}
  </div>

  {/* Dropdown (Mobile) */}
  <div className="dropdown-mobile">
    {isAuthenticated || session ? (
      <button
        className="loginBtn-mobile"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {displayName}
        {isVerified && (
          <i className="bi bi-patch-check-fill text-[#cc8800] mr-2" />
        )}
        <Image src="/arrow-down.svg" alt="Dropdown" width={12} height={12} />
      </button>
    ) : (
      <Link href="/login">
        <button className="loginBtn-mobile">Login</button>
      </Link>
    )}

    {/* Dropdown Menu (Mobile) */}
    {isDropdownOpen && (
      <div className="dropdown-menu-mobile">
        {dropdownItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className="dropdown-item-mobile"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
</div>
            <div className="flex items-center justify-between w-full">
                {/* Logo */}
                <div className="logo">
                    <Link href="/browse-pets">
                        <Image src="/paltu_logo.svg" alt="Logo" width={200} height={80} />
                    </Link>
                </div>

                {/* Desktop navigation links */}
                <div className="navLinks hidden md:flex items-center gap-5">
                    {links.map((link) => (
                        <Link key={link.href} href={`/${link.href}`}>
                            <span
                                className={`relative after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#ffffff] after:transition-all after:duration-300 hover:after:w-full ${activeLink === link.href
                                    ? "after:w-full"
                                    : "after:w-0"
                                    }`}
                                style={{ cursor: "pointer" }}
                                onClick={() => setActiveLink(link.href)}>
                                {link.name}
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="dropdown relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    {isAuthenticated || session ? (
                        <button
                            className="flex items-center justify-center gap-2 loginBtn"
                            style={{
                                minWidth: dropdownWidth, // Set button width dynamically
                            }}
                        >
                            {displayName}
                            {isVerified && <i className="bi bi-patch-check-fill text-[#cc8800] mr-2" />}
                            <Image src="/arrow-down.svg" alt="Dropdown" width={12} height={12} />
                        </button>
                    ) : (
                        <Link href="/login">
                            <button
                                className="flex items-center justify-center gap-2 loginBtn"
                                style={{
                                    minWidth: dropdownWidth, // Set button width dynamically
                                }}>
                                Login
                            </button>
                        </Link>
                    )}
                    {(isAuthenticated || session) && isDropdownOpen && (
                        <div
                            className="dropdown-menu absolute right-0 bg-white shadow-lg z-10 rounded-2xl py-1"
                            style={{
                                top: "calc(100% + 0.5rem)", // Positions it slightly below `top-full`
                                width: dropdownWidth, // Ensure dropdown matches button width
                            }}>
                            <Link
                                href={
                                    userRole === "vet"
                                        ? "/vet-panel"
                                        : userRole === "regular user"
                                            ? "/my-profile"
                                            : userRole === "admin"
                                                ? "/admin-panel"
                                                : "/"
                                }>
                                <div className="dropdown-item px-4 py-2 hover:bg-gray-100 hover:rounded-t-2xl cursor-pointer">
                                    {userRole === "vet"
                                        ? "Vet Panel"
                                        : userRole === "regular user"
                                            ? "My Profile"
                                            : userRole === "admin"
                                                ? "Admin Panel"
                                                : "Home"}
                                </div>
                            </Link>
                            <Link href="/my-listings">
                                <div className="dropdown-item px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                    My Listings
                                </div>
                            </Link>
                            <Link href="/my-applications">
                                <div className="dropdown-item px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                    My Applications
                                </div>
                            </Link>
                            <Link href="/notifications">
                                <div className="dropdown-item px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                    Notifications
                                </div>
                            </Link>

                            {/* Add Become Verified / Verified option */}
                            {userRole === "vet" && !isVerified && (
                                <Link href="/vet-get-verified-1">
                                    <div className="dropdown-item px-4 py-2 hover:bg-gray-100 cursor-pointer font-semibold italic">
                                        Get Verified
                                    </div>
                                </Link>
                            )}

                            <div
                                onClick={handleLogout}
                                className="dropdown-item px-4 py-2 text-red-600 hover:bg-gray-100 hover:rounded-b-2xl cursor-pointer">
                                Logout
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;