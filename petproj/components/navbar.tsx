"use client";

import Link from "next/link";
import "./navbar.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import "bootstrap-icons/font/bootstrap-icons.css";

interface OverrideLink { name: string; href: string }
interface OverrideDropdownItem { href: string; label: string; isAction?: boolean }

const Navbar = ({
  linksOverride,
  dropdownOverride,
  logoHref,
}: {
  linksOverride?: OverrideLink[];
  dropdownOverride?: OverrideDropdownItem[];
  logoHref?: string;
}) => {
  const [activeLink, setActiveLink] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileView, setMobileView] = useState("navlinks"); // 'navlinks' or 'dropdown'
  let hideTimeout: ReturnType<typeof setTimeout>;
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isFoundersClub, setIsFoundersClub] = useState<boolean>(false);

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
        try {
            await apiLogout(); // Use the AuthContext logout
        } catch (error) {
            console.error("Logout error:", error);
            // Force redirect as fallback
            window.location.href = "/login";
        }
    };

    type UserRole =
  | "guest"
  | "regular user"
  | "vet"
  | "admin"
  | "shelter admin"
  | "shop admin"
  | "ecommerce admin";

// Determine role first
const userRole: UserRole =
  (user?.role as UserRole) ||
  (session?.user?.role as UserRole) ||
  "guest";

const navbarBackground: Record<UserRole, string> = {
  guest: "#A03048",
  "regular user": "#A03048",
  vet: "#480777",
  admin: "#065758",

  "shelter admin": "#1d6b34",
  "shop admin": "#b86b00",
  "ecommerce admin": "#004a99",
};

const buttonTextColor: Record<UserRole, string> = {
  guest: "#ffffff",
  "regular user": "#ffffff",
  vet: "#ffffff",
  admin: "#ffffff",
  "shop admin": "#ffffff",
  "shelter admin": "#ffffff",
  "ecommerce admin": "#ffffff",
};

const arrowColor: Record<UserRole, string> = {
  guest: "#ffd2e3",
  "regular user": "#ffd2e3",
  vet: "#e0c3f7",
  admin: "#7fe1d3",

  "shelter admin": "#8fe4a8",
  "shop admin": "#ffc266",
  "ecommerce admin": "#80b3ff",
};


    // Updated dropdown items with isAction flag
    const defaultDropdownItems = [
        {
            href:
                userRole === "vet"
                    ? "/vet-panel"
                    : userRole === "admin"
                    ? "/admin-panel"
                    : userRole === "shop admin"
                    ? "/shop-panel"
                    : userRole === "shelter admin"
                    ? "/rescue-panel"
                    : "/my-profile",
            label:
                userRole === "vet"
                    ? "Vet Panel"
                    : userRole === "admin"
                    ? "Admin Panel"
                    : userRole === "shop admin"
                    ? "Shop Panel"
                    : userRole === "shelter admin"
                    ? "Rescue Panel"
                    : "My Profile",
            isAction: false,
        },
        { href: "/my-listings", label: "My Listings", isAction: false },
        { href: "/my-applications", label: "My Applications", isAction: false },
        { href: "/notifications", label: "Notifications", isAction: false },
        { href: "/logout", label: "Logout", isAction: true },
    ];
    const dropdownItems = dropdownOverride || defaultDropdownItems;

    const navbarStyle = { backgroundColor: navbarBackground[userRole] };

    const displayName =
        session?.user?.name ||
        session?.user?.email ||
        user?.name ||
        user?.email ||
        "User";

    const profileImage =
        user?.profile_image_url ||
        session?.user?.image || // next-auth google login usually gives `image`
        "/default-avatar.png"; // put your default icon in public folder

    // Log the auth context props as soon as they are fetched
    useEffect(() => {
        // console.log("AuthContext - User:", user);
        // console.log("AuthContext - Role:", userRole);
        // console.log("AuthContext - isAuthenticated:", isAuthenticated);
        // console.log("NextAuth - Session:", session);
    }, [user, isAuthenticated, session]); // Logs when these values update

    // Navigation Links
    const defaultLinks = [
        { name: "Pets", href: "browse-pets" },
        { name: "Bazaar", href: "marketplace" },
        { name: "Pet Care", href: "pet-care" },
        { name: "Lost & Found", href: "lost-and-found" },
        //{ name: "Paltuu AI", href: "llm" },
    ];
    const links = linksOverride || defaultLinks;

    useEffect(() => {
        const fetchVerificationStatus = async () => {
            if (userRole === "vet" && user?.id) {
                console.log(user.id);
                try {
                    const response = await fetch(
                        `/api/is-verified-by-user-id/${user.id}`
                    );
                    const data = await response.json();
                    console.log("gagea", data);
                    setIsVerified(data.profile_verified); // assuming the response contains an 'isVerified' boolean
                    console.log("Verified", data.profile_verified);
                } catch (error) {
                    console.error(
                        "Failed to fetch verification status:",
                        error
                    );
                }
            }
        };

        fetchVerificationStatus();
    }, [userRole, user?.id]);

    useEffect(() => {
        const checkFoundersClub = async () => {
            if (user?.id) {
                try {
                    const res = await fetch(
                        `/api/founders-club/?user_id=${user.id}`
                    );
                    const data = await res.json();
                    setIsFoundersClub(data.isFoundersClub); // assuming response is { isFoundersClub: true }
                } catch (error) {
                    console.error("Error checking Founders Club:", error);
                }
            }
        };

        checkFoundersClub();
    }, [user?.id]);

    useEffect(() => {
        const currentPath = window.location.pathname.split("/")[1];
        setActiveLink(currentPath);
    }, []);

  const dropdownWidth = `${
    Math.max(
      displayName.length,
      ...dropdownItems.map((item) => item.label.length)
    ) *
      10 +
    50
  }px`;

  const handleNameplateClick = () => {
    setMobileView("dropdown");
  };

  const handleBackClick = () => {
    setMobileView("navlinks");
  };

    return (
        <nav className="navbar" style={navbarStyle}>
            {/* Hamburger Menu Button (Mobile Only) */}
            <button
                className="hamburger md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <div className="hamburger-line" />
                <div className="hamburger-line" />
                <div className="hamburger-line" />
            </button>

      {/* Mobile Menu */}
      <div
        className={`mobile-menu ${isMenuOpen ? "open" : ""} md:hidden`}
        style={{ backgroundColor: navbarBackground[userRole] }}
      >
        {/* Navigation Links - Slides out when nameplate is clicked */}
        <div className={`navLinks-mobile transition-all duration-300 ${mobileView === "dropdown" ? "translate-x-full opacity-0 absolute" : "translate-x-0 opacity-100"}`}>
          {links.map((link) => (
            <Link key={link.href} href={`/${link.href}`}>
              <span
                className={`mobile-link ${
                  activeLink === link.href ? "active" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Nameplate - Slides out when clicked */}
        <div className={`dropdown-mobile transition-all duration-300 ${mobileView === "dropdown" ? "translate-x-full opacity-0 absolute" : "translate-x-0 opacity-100"}`}>
          {isAuthenticated || session ? (
            <div className="relative group w-full">
              <button
                className="loginBtn-mobile flex flex-row items-center gap-3 w-full px-4 py-3"
                onClick={handleNameplateClick}
              >
                <div className="relative">
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                  />
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      <i className="bi bi-patch-check-fill text-amber-500 text-xs" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{displayName}</p>
                </div>
                {isFoundersClub && (
                  <div className="bg-white/20 p-1.5 rounded-full">
                    <Image
                      src="/white_icon.svg"
                      alt="Founders Club"
                      width={16}
                      height={16}
                    />
                  </div>
                )}
                <Image
                  src="/arrow-down.svg"
                  alt="Dropdown"
                  width={12}
                  height={12}
                  className="filter invert"
                />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="loginBtn-mobile">Login</button>
            </Link>
          )}
        </div>

        {/* Dropdown Menu - Slides in when nameplate is clicked */}
        <div className={`dropdown-content-mobile transition-all duration-300 ${mobileView === "dropdown" ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 absolute"}`}>
          {/* Back Button */}
          <button 
            className="back-button-mobile flex items-center gap-2 text-white mb-4 px-4 py-2"
            onClick={handleBackClick}
          >
            <i className="bi bi-arrow-left"></i>
            Back
          </button>
          
          {/* Dropdown Items */}
          <div className="w-full">
            {dropdownItems.map((item) =>
              item.isAction ? (
                <div
                  key={item.href}
                  className="dropdown-item-mobile"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  {item.label}
                </div>
              ) : (
                <Link key={item.href} href={item.href}>
                  <div
                    className="dropdown-item-mobile"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
      
      {/* Rest of the desktop code remains unchanged */}
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="logo">
          <Link href={logoHref || "/browse-pets"}>
            <Image src="/paltu_logo.svg" alt="Logo" width={200} height={80} />
          </Link>
        </div>

                {/* Desktop navigation links */}
                <div className="navLinks hidden md:flex items-center gap-5">
                    {links.map((link) => (
                        <Link key={link.href} href={`/${link.href}`}>
                            <span
                                className={`relative after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#ffffff] after:transition-all after:duration-300 hover:after:w-full ${
                                    activeLink === link.href
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

        <div
          className="dropdown relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isAuthenticated || session ? (
            <button
              className="flex items-center justify-center gap-2 loginBtn relative group overflow-hidden"
              style={{ minWidth: dropdownWidth }}
            >
              {/* Profile Image with Badge - Updated nameplate */}
              <div className="relative">
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/30 transition-all duration-300"
                />
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    <i className="bi bi-patch-check-fill text-amber-500 text-xs" />
                  </div>
                )}
              </div>

              {/* User Name - shown only on desktop */}
              <div>
                <span className="text-sm font-medium">
                  {displayName}
                </span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1">
                {isFoundersClub && (
                  <div className="bg-white/20 p-1.5 rounded-full">
                    <Image
                      src="/primary_icon.svg"
                      alt="Founders Club"
                      width={16}
                      height={16}
                    />
                  </div>
                )}
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ) : (
            <Link href="/login">
              <button
                className="flex items-center justify-center gap-2 loginBtn"
                style={{
                  minWidth: dropdownWidth, // Set button width dynamically
                }}
              >
                Login
              </button>
            </Link>
          )}
          {(isAuthenticated || session) && isDropdownOpen && (
            <div
              className="dropdown-menu absolute right-0 bg-white shadow-lg z-20 rounded-2xl py-2 text-sm font-medium"
              style={{
                top: "calc(100% + 0.5rem)",
                width: dropdownWidth,
              }}
            >
              {dropdownOverride && dropdownOverride.length ? (
                // Render only overridden items (e.g., Home, Logout) for panels
                <div>
                  { (dropdownOverride as any).map((item: any) => (
                    item.isAction ? (
                      <div
                        key={item.href}
                        onClick={handleLogout}
                        className="dropdown-item flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <i className="bi bi-box-arrow-right"></i> {item.label}
                      </div>
                    ) : (
                      <Link key={item.href} href={item.href}>
                        <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          {item.label}
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              ) : (
                <>
                  {/* Profile / Panel */}
                  <Link
                    href={
                      userRole === "vet"
                        ? "/vet-panel"
                        : userRole === "regular user"
                        ? "/my-profile"
                        : userRole === "admin"
                        ? "/admin-panel"
                        : "/"
                    }
                  >
                    <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 hover:rounded-t-2xl cursor-pointer">
                      <i className="bi bi-person-circle text-gray-600"></i>
                      {userRole === "vet"
                        ? "Vet Panel"
                        : userRole === "regular user"
                        ? "My Profile"
                        : userRole === "admin"
                        ? "Admin Panel"
                        : "Home"}
                    </div>
                  </Link>
                  <div className="border-t my-1"></div>
                  <Link href="/my-listings">
                    <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <i className="bi bi-card-list text-gray-600"></i> My Listings
                    </div>
                  </Link>
                  <Link href="/my-applications">
                    <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <i className="bi bi-file-earmark-text text-gray-600"></i> My Applications
                    </div>
                  </Link>
                  <Link href="/notifications">
                    <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <i className="bi bi-bell text-gray-600"></i> Notifications
                    </div>
                  </Link>
                  <div className="border-t my-1"></div>
                  <div
                    onClick={handleLogout}
                    className="dropdown-item flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 hover:rounded-b-2xl cursor-pointer"
                  >
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </div>
                </>
              )}
            </div>
          )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;