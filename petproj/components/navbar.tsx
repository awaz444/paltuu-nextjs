"use client";

import Link from "next/link";
import "./navbar.css";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCart } from "@/app/store/slices/cartSlice";
import type { RootState, AppDispatch } from "@/app/store/store";
import { useSession, signOut } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  updateCartItem,
  removeCartItem,
  setCartItems,
} from "@/app/store/slices/cartSlice";
import MobileCartModal from "./MobileCartModal";
import "bootstrap-icons/font/bootstrap-icons.css";
interface OverrideLink {
  name: string;
  href: string;
}
interface OverrideDropdownItem {
  href: string;
  label: string;
  icon: string;
  isAction?: boolean;
}

const Navbar = ({
  linksOverride,
  dropdownOverride,
  logoHref,
  hideCart,
}: {
  linksOverride?: OverrideLink[];
  dropdownOverride?: OverrideDropdownItem[];
  logoHref?: string;
  hideCart?: boolean;
}) => {
  const [activeLink, setActiveLink] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileView, setMobileView] = useState("navlinks"); // 'navlinks' or 'dropdown'
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isFoundersClub, setIsFoundersClub] = useState<boolean>(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    // Set a longer timeout to allow moving to dropdown
    hideTimeoutRef.current = setTimeout(() => setIsDropdownOpen(false), 300);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

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
      window.location.href = "/auth";
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
    (user?.role as UserRole) || (session?.user?.role as UserRole) || "guest";

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
      icon: "bi-person-circle", // 👈 same as desktop
      isAction: false,
    },
    {
      href: "/my-listings",
      label: "My Listings",
      icon: "bi-card-list",
      isAction: false,
    },
    {
      href: "/my-applications",
      label: "My Applications",
      icon: "bi-file-earmark-text",
      isAction: false,
    },
    {
      href: "/my-orders",
      label: "My Orders",
      icon: "bi-bag",
      isAction: false,
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: "bi-bell",
      isAction: false,
    },
    {
      href: "/logout",
      label: "Logout",
      icon: "bi-box-arrow-right",
      isAction: true,
    },
  ];
  const dropdownItems = dropdownOverride || defaultDropdownItems;

  const navbarStyle = { backgroundColor: navbarBackground[userRole] };

  const displayName =
    user?.name ||
    user?.email ||
    session?.user?.name ||
    session?.user?.email ||
    "User";

  const profileImage =
    user?.profile_image_url ||
    session?.user?.image || // next-auth google login usually gives `image`
    "/default-avatar.png"; // put your default icon in public folder

  // Cart state for navbar dropdown
  const [cartOpen, setCartOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const cartState = useSelector((state: RootState) => state.cart);
  const cartHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartItemsNav = cartState.items ?? [];
  const cartLoading = cartState.loading ?? false;
  // Fetch cart on mount
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  // Bounce animation for cart button
  const [bounce, setBounce] = useState(false);
  const prevTotalRef = useRef(0);
  const totalCartItems = cartItemsNav.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    if (totalCartItems > prevTotalRef.current) {
      setBounce(true);
      setTimeout(() => setBounce(false), 500); // 0.5s bounce
    }
    prevTotalRef.current = totalCartItems;
  }, [totalCartItems]);

  // Cart dropdown mouse handlers
  const handleCartMouseEnter = () => {
    if (cartHideTimeout.current) clearTimeout(cartHideTimeout.current);
    setCartOpen(true);
  };
  const handleCartMouseLeave = () => {
    if (cartHideTimeout.current) clearTimeout(cartHideTimeout.current);
    cartHideTimeout.current = setTimeout(() => setCartOpen(false), 350);
  };

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
    { name: "Bazaar", href: "bazaar" },
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
          console.error("Failed to fetch verification status:", error);
        }
      }
    };

    fetchVerificationStatus();
  }, [userRole, user?.id]);

  useEffect(() => {
    const checkFoundersClub = async () => {
      if (user?.id) {
        try {
          const res = await fetch(`/api/founders-club/?user_id=${user.id}`);
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
      {/* Mobile Navbar Top Row */}
      <div className="flex items-center justify-between w-full lg:hidden px-4 py-3">
        {/* Left: Hamburger */}
        <button
          className="hamburger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="hamburger-line z-40" />
          <div className="hamburger-line z-40" />
          <div className="hamburger-line z-40" />
        </button>

        {/* Center: Logo */}
        <Link href={logoHref || "/"} className="logo">
          <Image src="/paltu_logo.svg" alt="Logo" width={200} height={80} />
        </Link>

        {/* Right: Cart */}

        {!hideCart && (
          <button
            onClick={() => setIsCartModalOpen(true)}
            className={`absolute right-6 top-1/2 -translate-y-1/2 z-20 p-2 rounded-md bg-white/10 hover:bg-white/20 ${
              bounce ? "animate-bounce" : ""
            }`}
          >
            <i className="bi bi-cart3 text-white text-lg" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-1.5 py-0.5">
                {totalCartItems}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Mobile Drawer + Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] lg:hidden transition-opacity duration-500 ease-in-out
    ${
      isMenuOpen
        ? "opacity-100 pointer-events-auto"
        : "opacity-0 pointer-events-none"
    }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 left-0 h-full w-3/4 z-[9999] transform transition-transform duration-500 ease-in-out
      ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
      rounded-tr-3xl rounded-br-3xl`}
          style={{ backgroundColor: navbarBackground[userRole] }}
        >
          <div className="h-full flex flex-col items-center">
            {/* Top Bar */}
            <div className="flex justify-between items-center w-full px-5 py-6 mt-3 ml-2">
              {/* Hamburger */}

              <button
                className="lg:hidden flex flex-col justify-between w-6 h-5"
                onClick={() => {
                  setIsMenuOpen(false);
                  setMobileView("navlinks");
                }}
              >
                <span className="block h-[3px] w-full bg-white rounded"></span>
                <span className="block h-[3px] w-full bg-white rounded"></span>
                <span className="block h-[3px] w-full bg-white rounded"></span>
              </button>

              {/* Logo */}
              <div className="logo">
                <Link href="/">
                  <Image
                    src="/paltu_logo.svg"
                    alt="Logo"
                    width={230} // bigger logo
                    height={90}
                  />
                </Link>
              </div>

              <div className="w-8" />
            </div>

            {/* Main Section */}
            <div className="flex flex-col justify-center items-center w-full h-full px-4 relative space-y-6">
              {/* Navlinks */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  mobileView === "navlinks"
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-6 pointer-events-none"
                } mt-32`}
              >
                <div className="space-y-6 text-center">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={`/${link.href}`}
                      onClick={() => {
                        setIsMenuOpen(false); // 👈 close drawer
                        setMobileView("navlinks"); // reset view
                      }}
                    >
                      <span className="py-3 block text-white text-lg flex items-center justify-center gap-3">
                        {link.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Nameplate */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  mobileView === "dropdown"
                    ? "-translate-y-[240px]"
                    : "translate-y-0"
                }`}
              >
                {isAuthenticated ? (
                  <button
                    className="flex flex-row items-center justify-center gap-4 w-full px-4 py-3"
                    onClick={() =>
                      setMobileView(
                        mobileView === "navlinks" ? "dropdown" : "navlinks"
                      )
                    }
                  >
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                    />
                    <p className="text-white font-medium">{displayName}</p>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`text-white transition-transform duration-300 ${
                        mobileView === "dropdown" ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <Link href="/auth">
                    <button className="w-full text-center text-white font-medium py-2 text-xl">
                      Login
                    </button>
                  </Link>
                )}
              </div>

              {/* Dropdown */}
              <div
                className={`w-full transition-all duration-500 ease-in-out ${
                  mobileView === "dropdown"
                    ? "opacity-100 -translate-y-[240px]"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                <div className="space-y-4 text-center">
                  {dropdownItems.map((item) =>
                    item.isAction ? (
                      <div
                        key={item.href}
                        className="py-3 text-white text-lg cursor-pointer flex items-center justify-center gap-3"
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false); // 👈 close drawer
                          setMobileView("navlinks");
                        }}
                      >
                        <i className={`bi ${item.icon} text-xl`} />{" "}
                        {/* icon added */}
                        {item.label}
                      </div>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setIsMenuOpen(false); // 👈 close drawer
                          setMobileView("navlinks");
                        }}
                      >
                        <div className="py-3 text-white text-lg cursor-pointer flex items-center justify-center gap-3">
                          <i className={`bi ${item.icon} text-xl`} />{" "}
                          {/* icon added */}
                          {item.label}
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the desktop code remains unchanged */}
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="logo hidden lg:block">
          <Link href={logoHref || "/"}>
            <Image src="/paltu_logo.svg" alt="Logo" width={200} height={80} />
          </Link>
        </div>

        {/* Desktop navigation links */}
        <div className="navLinks hidden lg:flex items-center gap-5">
          {links.map((link) => (
            <Link key={link.href} href={`/${link.href}`}>
              <span
                className={`relative after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#ffffff] after:transition-all after:duration-300 hover:after:w-full ${
                  activeLink === link.href ? "after:w-full" : "after:w-0"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setActiveLink(link.href)}
              >
                {link.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4 mr-16">
          {/* Cart */}
          {!hideCart && (
            <div
              className="relative"
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <button
                onClick={() => setCartOpen((v) => !v)}
                className={`flex items-center gap-2 cartBtn p-2 rounded-md bg-white/10 hover:bg-white/20 ${
                  bounce ? "animate-bounce" : ""
                }`}
              >
                <i className="bi bi-cart3 text-white" />
                <span className="sr-only">Cart</span>
                {totalCartItems > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
                    {totalCartItems}
                  </span>
                )}
              </button>

              {cartOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-lg z-30 p-4 text-sm">
                  <div className="flex items-center justify-between font-medium mb-3">
                    <div>Cart</div>
                    <div className="text-xs text-gray-500">
                      {totalCartItems} items
                    </div>
                  </div>

                  {cartState.loading ? (
                    <div className="text-gray-500">Loading...</div>
                  ) : cartItemsNav.length === 0 ? (
                    <div className="text-gray-500">Your cart is empty.</div>
                  ) : (
                    <div className="divide-y max-h-64 overflow-auto">
                      {cartItemsNav.map((it, index) => {
                        const uniqueKey = `${it.id}-${
                          it.variantTitle ?? ""
                        }-${JSON.stringify(it.attributes ?? [])}-${index}`;

                        return (
                          <div
                            key={uniqueKey}
                            className="py-3 flex items-center gap-4"
                          >
                            {/* Image */}
                            <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={it.image ?? "/placeholder-product.jpg"}
                                alt={it.title ?? "cart item"}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-medium break-words">
                                  {it.title}
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    // Generate unique key for frontend filtering (for variant differentiation)
                                    const cartItemUniqueKey = `${it.id}-${
                                      it.variantTitle ?? ""
                                    }-${JSON.stringify(it.attributes ?? [])}`;

                                    // 🔹 Dispatch backend delete using the real id
                                    dispatch(
                                      removeCartItem({
                                        cartItemId: it.id,
                                      })
                                    );

                                    // 🔹 Remove visually from Redux store using your variant-aware key
                                    dispatch(
                                      setCartItems(
                                        cartItemsNav.filter((item) => {
                                          const itemKey = `${item.id}-${
                                            item.variantTitle ?? ""
                                          }-${JSON.stringify(
                                            item.attributes ?? []
                                          )}`;
                                          return itemKey !== cartItemUniqueKey;
                                        })
                                      )
                                    );
                                  }}
                                  aria-label={`Remove ${it.title} from cart`}
                                  title="Remove"
                                  className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none bg-transparent border-none"
                                >
                                  <i className="bi bi-trash text-lg"></i>
                                </button>
                              </div>

                              {/* Variant */}
                              {/* {it.variantTitle && (
                                <div className="text-xs text-gray-500">
                                  Variant:{" "}
                                  <span className="text-gray-700">
                                    {it.variantTitle}
                                  </span>
                                </div>
                              )} */}

                              {it.attributes && (
                                <div className="text-xs text-gray-500">
                                  {Object.entries(it.attributes)
                                    .map(([key, val]) => `${key}: ${val}`)
                                    .join(", ")}
                                </div>
                              )}

                              {/* Quantity */}
                              <div className="text-xs text-gray-500">
                                Qty: {it.qty}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-sm font-semibold">
                              PKR {(it.price * it.qty).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-t mt-3 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Subtotal</div>
                      <div className="text-sm font-semibold">
                        PKR{" "}
                        {cartItemsNav
                          .reduce((sum, i) => sum + i.price * i.qty, 0)
                          .toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push("/cart")}
                        className="flex-1 bg-primary text-white py-2 rounded-lg font-medium"
                      >
                        Go to Cart
                      </button>
                      <button
                        onClick={() => router.push("/checkout")}
                        disabled={cartItemsNav.length === 0}
                        className={`flex-1 py-2 rounded-lg font-medium ${
                          cartItemsNav.length === 0
                            ? "text-gray-400 border border-gray-300 cursor-not-allowed bg-gray-100"
                            : "text-primary border border-primary hover:bg-primary hover:text-white transition"
                        }`}
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated || session ? (
            <div
              className="relative group"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="flex items-center justify-center gap-2 loginBtn relative overflow-hidden"
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
                    <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
                      <i className="bi bi-patch-check-fill text-amber-500 text-xs" />
                    </div>
                  )}
                </div>

                {/* User Name - shown only on desktop */}
                <div>
                  <span className="text-sm font-medium">{displayName}</span>
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
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>

              {(isAuthenticated || session) && isDropdownOpen && (
                <div
                  className="dropdown-menu absolute right-0 bg-white shadow-lg z-20 rounded-2xl py-2 text-sm font-medium"
                  style={{
                    top: "calc(100% + 0.5rem)",
                    width: dropdownWidth,
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {dropdownOverride && dropdownOverride.length ? (
                    // Render only overridden items (e.g., Home, Logout) for panels
                    <div>
                      {(dropdownOverride as any).map((item: any) =>
                        item.isAction ? (
                          <div
                            key={item.href}
                            onClick={handleLogout}
                            className="dropdown-item flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <i className="bi bi-box-arrow-right"></i>{" "}
                            {item.label}
                          </div>
                        ) : (
                          <Link key={item.href} href={item.href}>
                            <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                              {item.label}
                            </div>
                          </Link>
                        )
                      )}
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
                      {userRole === "admin" && (
                        <Link href="/orders">
                          <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <i className="bi bi-card-list text-gray-600"></i> Orders
                          </div>
                        </Link>
                      )}
                      <Link href="/my-listings">
                        <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <i className="bi bi-card-list text-gray-600"></i> My
                          Listings
                        </div>
                      </Link>
                      <Link href="/my-applications">
                        <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <i className="bi bi-file-earmark-text text-gray-600"></i>{" "}
                          My Applications
                        </div>
                      </Link>
                      <Link href="/my-orders">
                        <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <i className="bi bi-bag text-gray-600"></i> My Orders
                        </div>
                      </Link>
                      <Link href="/notifications">
                        <div className="dropdown-item flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <i className="bi bi-bell text-gray-600"></i>{" "}
                          Notifications
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
          ) : (
            <Link href="/auth">
              <button className="flex items-center justify-center gap-2 loginBtn">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>
      <MobileCartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
