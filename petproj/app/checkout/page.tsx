"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Truck,
  CreditCard,
  Banknote,
  ArrowLeft,
  CheckCircle,
  Tag,
  Shield,
  BadgePercent,
} from "lucide-react";

import { CartGuard } from "@/components/CartGuard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import type { RootState } from "../store/store";
import { clearCart } from "@/app/store/slices/cartSlice";
import { fetchCart } from "@/app/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { getUserIdFromToken, getTokenFromCookie, decodeJwtPayload } from "@/utils/authClient";
import { FaUniversity } from "react-icons/fa";
import { useCartProtection } from "@/hooks/useCartProtection";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string; // new
  attribute?: string; // new
}

const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<any | null>(null);
  const [loadingCartData, setLoadingCartData] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [placing, setPlacing] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const loadingCart = useSelector((state: RootState) => state.cart.loading);
  // Cart protection - redirect if cart is empty
  const { isChecking, hasItems } = useCartProtection({
    redirectTo: "/cart",
    showMessage: true,
  });

  // Customer / Shipping form state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loadingShippingInfo, setLoadingShippingInfo] = useState(false);
  const [shippingInfoLoaded, setShippingInfoLoaded] = useState(false);
  const [checkoutVisitTracked, setCheckoutVisitTracked] = useState(false);

useEffect(() => {
  // Only fetch cart if it's empty
  if (cartItems.length === 0) {
    dispatch(fetchCart());
  }
}, [dispatch, cartItems.length]);

  // Track checkout page visit for retargeting (only once)
  useEffect(() => {
    if (cartItems.length > 0 && !checkoutVisitTracked) {
      setCheckoutVisitTracked(true);

      // Send tracking notification (non-blocking)
      const trackCheckoutVisit = async () => {
        try {
          const sessionId = getOrCreateGuestSessionId();
          const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

          // Get user info from auth token cookie if available
          let userName, userEmail, userId;
          if (typeof window !== "undefined") {
            try {
              const token = getTokenFromCookie();
              if (token) {
                const payload = decodeJwtPayload(token);
                if (payload) {
                  userId = payload.user_id || payload.id;
                  userName = payload.name;
                  userEmail = payload.email;
                }
              }
            } catch (e) {
              console.warn("Failed to parse user from token cookie", e);
            }
          }

          await fetch('/api/track-checkout-visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              userName,
              userEmail,
              sessionId,
              cartItems: cartItems.map(item => ({
                title: item.title,
                quantity: item.qty,
                price: item.price,
              })),
              cartTotal,
            }),
          });
        } catch (error) {
          console.warn('Failed to track checkout visit', error);
        }
      };

      trackCheckoutVisit();
    }
  }, [cartItems.length, checkoutVisitTracked]);

  // Fetch full cart object with cart_id
  useEffect(() => {
    const fetchCartData = async () => {
      if (cartItems.length === 0) return;

      setLoadingCartData(true);
      try {
        const sessionId = getOrCreateGuestSessionId();
        const params = new URLSearchParams();

        if (user?.id) {
          params.append('userId', user.id.toString());
        } else if (sessionId) {
          params.append('sessionId', sessionId);
        }

        const response = await fetch(`/api/bazaar/cart?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setCart(data.cart);
        }
      } catch (error) {
        console.error('Failed to fetch cart data:', error);
      } finally {
        setLoadingCartData(false);
      }
    };

    fetchCartData();
  }, [cartItems.length, user?.id]);

  // Load saved shipping info for logged-in users
  useEffect(() => {
    if (!user?.id || cartItems.length === 0) return; // skip if cart is empty

    let mounted = true;
    (async () => {
      setLoadingShippingInfo(true);
      try {
        const res = await fetch(
          `/api/bazaar/shipping-info?userId=${user.id}`
        );
        if (!res.ok) return;

        const json = await res.json();
        if (!mounted) return;

        if (json.shippingInfo) {
          const info = json.shippingInfo;
          setEmail(info.email || "");
          setFullName(info.full_name || "");
          setPhone(info.phone || "+92");
          setCity(info.city || "");
          setPostalCode(info.postal_code || "");
          setAddress(info.address || "");
          setShippingInfoLoaded(true);
        }
      } catch (e) {
        console.warn("Failed to load shipping info", e);
      } finally {
        setLoadingShippingInfo(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id, cartItems.length]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  const shipping = 200;
  const total = subtotal + shipping - discount;

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function
  const validatePhone = (phone: string) => {
    // Remove any non-digit characters except the +92 prefix
    const cleaned = phone.replace(/\D/g, "");
    // Check if it starts with 92 and has exactly 12 digits total (+92 + 10 digits)
    return cleaned.startsWith("92") && cleaned.length === 12;
  };

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // If empty, set to +92
    if (digitsOnly === "") {
      setPhone("+92");
      setPhoneError("");
      return;
    }

    // Ensure it starts with 92
    let formatted = digitsOnly;
    if (!digitsOnly.startsWith("92")) {
      formatted = "92" + digitsOnly.replace(/^92/, "");
    }

    // Limit to 12 digits total (92 + 10 digits)
    formatted = formatted.slice(0, 12);

    // Format as +92 XXX XXXXXXX
    let displayValue = "+" + formatted;
    if (formatted.length > 3) {
      displayValue = "+" + formatted.slice(0, 3) + " " + formatted.slice(3);
    }
    if (formatted.length > 6) {
      displayValue =
        "+" +
        formatted.slice(0, 3) +
        " " +
        formatted.slice(3, 6) +
        " " +
        formatted.slice(6);
    }

    setPhone(displayValue);

    // Validate and show error if incomplete
    if (formatted.length < 12) {
      setPhoneError("Phone number must be 10 digits after +92");
    } else {
      setPhoneError("");
    }
  };

  // Email change handler with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const applyPromoCode = () => {
    setPromoError("");
    const code = promoCode.trim().toUpperCase();

    if (code === "WELCOME10") {
      setDiscount(subtotal * 0.1); // 10% discount
      setPromoApplied(true);
    } else if (code === "PETLOVER15") {
      setDiscount(subtotal * 0.15); // 15% discount
      setPromoApplied(true);
    } else if (code === "FREESHIP") {
      setDiscount(shipping);
      setPromoApplied(true);
    } else if (code) {
      setPromoError("Invalid promo code");
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setDiscount(0);
    setPromoApplied(false);
    setPromoError("");
  };

  // Save shipping info for logged-in users
  const saveShippingInfo = async () => {
    if (!user?.id) return;

    try {
      const cleanPhone = phone.replace(/\s/g, "");

      await fetch("/api/bazaar/shipping-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email,
          fullName,
          phone: cleanPhone,
          city,
          postalCode,
          address,
        }),
      });
    } catch (error) {
      console.warn("Failed to save shipping info:", error);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    let isValid = true;

    // Email validation
    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Phone validation
    if (!phone) {
      setPhoneError("Phone number is required");
      isValid = false;
    } else if (!validatePhone(phone)) {
      setPhoneError("Phone number must be 10 digits after +92");
      isValid = false;
    }

    // Other required fields
    if (!fullName) {
      alert("Full name is required");
      isValid = false;
    }
    if (!address) {
      alert("Address is required");
      isValid = false;
    }

    return isValid;
  };


  // Show loading while checking cart
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if cart is empty (user will be redirected)
  if (!hasItems) {
    return null;
  }

  return (
    <CartGuard>
      <div className="min-h-screen flex flex-col">
        <div className="min-h-screen py-10 px-4 md:px-12 lg:px-20">
          <div className="max-w-7xl mx-auto">
            {" "}
            {/* Increased max-width */}
            {/* Header */}
            <div className="mb-8 flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            </div>
            {/* Changed grid layout to 60-40 ratio */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Section - Shipping & Payment - 60% width */}
              <div className="lg:col-span-3 space-y-6">
                {/* Login Teaser for Guest Users */}
                {!isAuthenticated && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Save time on future orders!
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Log in to save your shipping details and enjoy faster
                          checkout next time.
                        </p>
                        <button
                          onClick={() =>
                            router.push("/auth?redirect=/checkout")
                          }
                          className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
                        >
                          Log In
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved Info Indicator for Logged-in Users */}
                {isAuthenticated && shippingInfoLoaded && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="text-green-900 font-medium">
                          Shipping details loaded from your account
                        </p>
                        <p className="text-green-700 text-sm">
                          Your information will be automatically saved when you
                          place this order
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Info */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
                    <Truck className="mr-2 text-primary" size={24} />
                    Shipping Information
                  </h2>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                          emailError ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {emailError && (
                        <p className="text-red-500 text-sm mt-1">
                          {emailError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+92 300 1234567"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                          phoneError ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {phoneError && (
                        <p className="text-red-500 text-sm mt-1">
                          {phoneError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="Enter postal code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complete Address *
                      </label>
                      <textarea
                        placeholder="Enter your complete address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                        rows={3}
                      />
                    </div>
                  </form>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
                    <CreditCard className="mr-2 text-primary" size={24} />
                    Payment Method
                  </h2>
                  <div className="space-y-3">
                    {/* Cash on Delivery */}
                    <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="payment"
                        className="h-4 w-4 text-primary"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      <Banknote size={20} className="text-green-600" />
                      <div>
                        <span className="text-gray-700 font-medium">
                          Cash on Delivery
                        </span>
                        <p className="text-sm text-gray-500">
                          Pay when you receive your order
                        </p>
                      </div>
                    </label>

                    {/* Bank Transfer */}
                    <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="payment"
                        className="h-4 w-4 text-primary"
                        checked={paymentMethod === "bank"}
                        onChange={() => setPaymentMethod("bank")}
                      />
                      <FaUniversity size={22} className="text-indigo-600" />
                      <div>
                        <span className="text-gray-700 font-medium">
                          Bank Transfer
                        </span>
                        <p className="text-sm text-gray-500">
                          Transfer directly from your bank
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Section - Order Summary - 40% width */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-6 h-fit shadow-sm border border-gray-200 sticky top-6">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900">
                    Order Summary
                  </h2>

                  {/* Items List - Updated Layout */}
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-gray hover:border-primary/30 transition-all duration-200"
                      >
                        {/* Product Image with Quantity Badge */}
                        <div className="relative flex-shrink-0">
                          <div className="h-16 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                            <Image
                              src={item.image ?? "/placeholder.png"}
                              alt={item.title}
                              width={64}
                              height={64}
                              className="object-cover h-full w-full"
                            />
                          </div>
                          {/* Quantity Badge */}
                          <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                            {item.qty}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          {/* Product Name */}
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h3>

                          {/* Variant & Attribute */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.variantTitle && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-medium shadow-sm">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mr-1"></div>
                                {item.variantTitle}
                              </span>
                            )}
                            {Array.isArray(item.attributes) &&
                              item.attributes.map((attr, idx) => (
                                <div key={idx} className="leading-snug">
                                  {attr.name && (
                                    <span className="text-gray-600">
                                      {attr.name}:{" "}
                                    </span>
                                  )}
                                  <span className="font-medium text-gray-800">
                                    {attr.value}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {/* 💰 Price and Quantity Summary */}
                          <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-lg font-medium text-gray-700">
                                {item.qty} × Rs {item.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-primary font-semibold text-sm">
                              <span>
                                {(item.price * item.qty).toLocaleString()} PKR
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-700 flex items-center">
                        <Tag size={18} className="mr-2 text-primary" />
                        Promo Code
                      </h3>
                      {promoApplied && (
                        <button
                          onClick={removePromoCode}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {promoApplied ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                          <CheckCircle
                            size={18}
                            className="text-green-500 mr-2"
                          />
                          <span className="text-green-700 font-medium">
                            Promo applied!
                          </span>
                        </div>
                        <span className="text-green-700 font-medium">
                          -Rs {discount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap sm:flex-nowrap gap-2">
                        <input
                          type="text"
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 min-w-0 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                        />
                        <button
                          onClick={applyPromoCode}
                          disabled={!promoCode.trim()}
                          className="w-full sm:w-auto px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                          <BadgePercent size={18} className="mr-1" />
                          Apply
                        </button>
                      </div>
                    )}

                    {promoError && (
                      <p className="text-red-500 text-sm mt-2">{promoError}</p>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-3 text-gray-700 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rs {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Rs {shipping.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-Rs {discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg text-gray-900 border-t pt-3">
                      <span>Total</span>
                      <span>Rs {total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
                    <Shield size={20} className="mr-2 text-primary" />
                    Secure checkout
                  </div>

                  {/* Place Order Button */}
                  <button
                    disabled={placing || loadingCartData || !cart}
                    onClick={async () => {
                      // Check if we have items in Redux cart
                      if (cartItems.length === 0) {
                        alert("Cart is empty");
                        return;
                      }

                      // Check if we have the cart object with cart_id
                      if (!cart || !cart.cart_id) {
                        alert("Unable to process order. Please refresh the page.");
                        return;
                      }

                      if (!validateForm()) {
                        return;
                      }

                      if (paymentMethod === "bank") {
                        const sessionId = getOrCreateGuestSessionId();
                        const cleanPhone = phone.replace(/\s/g, "");

                        if (user?.id) {
                          await saveShippingInfo();
                        }

                        const cartData = {
                          userId: user?.id || null,
                          sessionId,
                          cartId: cart.cart_id,
                          customerInfo: {
                            email,
                            phone: cleanPhone,
                            name: fullName,
                          },
                          shippingAddress: { city, postalCode, address },
                          billingAddress: null,
                          paymentMethod: "bank_transfer",
                          notes: "",
                          subtotal: subtotal,
                          shippingAmount: shipping,
                          discountAmount: discount,
                          totalAmount: total,
                          items: cartItems,
                        };

                        const cartDataEncoded = encodeURIComponent(
                          JSON.stringify(cartData)
                        );
                        router.push(
                          `/payment-confirmation?cartData=${cartDataEncoded}`
                        );
                        return;
                      }

                      setPlacing(true);
                      try {
                        const sessionId = getOrCreateGuestSessionId();
                        const cleanPhone = phone.replace(/\s/g, "");

                        if (user?.id) {
                          await saveShippingInfo();
                        }

                        const body = {
                          userId: user?.id || null,
                          sessionId,
                          cartId: cart.cart_id,
                          customerInfo: {
                            email,
                            phone: cleanPhone,
                            name: fullName,
                          },
                          shippingAddress: { city, postalCode, address },
                          billingAddress: null,
                          paymentMethod,
                          notes: "",
                        };

                        const res = await fetch("/api/bazaar/orders", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        });

                        const data = await res.json();
                        if (!res.ok) {
                          alert(
                            data.message ||
                              data.error ||
                              "Failed to place order"
                          );
                          setPlacing(false);
                          return;
                        }

                        const order = data.order;
                        try {
                          dispatch(clearCart() as any);
                        } catch (e) {
                          console.warn("Failed to clear client cart", e);
                        }
                        setCart(null);

                        router.push(
                          `/order-confirmed?orderNumber=${encodeURIComponent(
                            order.order_number
                          )}`
                        );
                      } catch (err) {
                        console.error("Place order failed", err);
                        alert("Failed to place order");
                      } finally {
                        setPlacing(false);
                      }
                    }}
                    className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {placing
                      ? "Placing order..."
                      : paymentMethod === "bank"
                      ? "Continue to Payment"
                      : "Place Order"}
                  </button>

                  {/* Terms Note */}
                  <p className="text-xs text-gray-500 text-center mt-3">
                    By proceeding, you agree to our{" "}
                    <Link
                      href="/terms-and-conditions"
                      className="text-primary hover:underline"
                    >
                      Terms & Conditions
                    </Link>
                    ,{" "}
                    <Link
                      href="/shipping-policy"
                      className="text-primary hover:underline"
                    >
                      Shipping Policy
                    </Link>
                    , and{" "}
                    <Link
                      href="/refund&return-policy"
                      className="text-primary hover:underline"
                    >
                      Return & Refund Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CartGuard>
  );
};

export default CheckoutPage;
