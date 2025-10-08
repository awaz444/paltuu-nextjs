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
import Navbar from "@/components/navbar";
import { useDispatch } from "react-redux";
import { clearCart } from "@/app/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { FaUniversity } from "react-icons/fa";
import { useCartProtection } from "@/hooks/useCartProtection";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const CheckoutPage = () => {
  const [cart, setCart] = useState<any | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [placing, setPlacing] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  // Cart protection - redirect if cart is empty
  const { isChecking, hasItems } = useCartProtection({
    redirectTo: '/cart',
    showMessage: true
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
  useLoadCart(setCart, setCartItems, setLoadingCart);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
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
    const cleaned = phone.replace(/\D/g, '');
    // Check if it starts with 92 and has exactly 12 digits total (+92 + 10 digits)
    return cleaned.startsWith('92') && cleaned.length === 12;
  };

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // If empty, set to +92
    if (digitsOnly === '') {
      setPhone('+92');
      setPhoneError('');
      return;
    }

    // Ensure it starts with 92
    let formatted = digitsOnly;
    if (!digitsOnly.startsWith('92')) {
      formatted = '92' + digitsOnly.replace(/^92/, '');
    }

    // Limit to 12 digits total (92 + 10 digits)
    formatted = formatted.slice(0, 12);

    // Format as +92 XXX XXXXXXX
    let displayValue = '+' + formatted;
    if (formatted.length > 3) {
      displayValue = '+' + formatted.slice(0, 3) + ' ' + formatted.slice(3);
    }
    if (formatted.length > 6) {
      displayValue = '+' + formatted.slice(0, 3) + ' ' + formatted.slice(3, 6) + ' ' + formatted.slice(6);
    }

    setPhone(displayValue);
    
    // Validate and show error if incomplete
    if (formatted.length < 12) {
      setPhoneError('Phone number must be 10 digits after +92');
    } else {
      setPhoneError('');
    }
  };

  // Email change handler with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
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

  // Validate form before submission
  const validateForm = () => {
    let isValid = true;

    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Phone validation
    if (!phone) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!validatePhone(phone)) {
      setPhoneError('Phone number must be 10 digits after +92');
      isValid = false;
    }

    // Other required fields
    if (!fullName) {
      alert('Full name is required');
      isValid = false;
    }
    if (!address) {
      alert('Address is required');
      isValid = false;
    }

    return isValid;
  };

  // Initialize phone with +92 on component mount
  useEffect(() => {
    setPhone('+92');
  }, []);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-10 px-4 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center">
            <button onClick={() => router.push('/cart')} className="flex items-center text-gray-600 hover:text-primary transition-colors mr-4">
              <ArrowLeft size={20} className="mr-2" />
              Back to Cart
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section - Shipping & Payment */}
            <div className="lg:col-span-2 space-y-6">
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
                        emailError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
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
                        phoneError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {phoneError && (
                      <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                    )}
                    {/* <p className="text-xs text-gray-500 mt-1">
                      Format: +92 followed by 10 digits (e.g., +92 300 1234567)
                    </p> */}
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
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
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
                  {/* Credit / Debit Card */}
                  {/* <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      className="h-4 w-4 text-primary"
                      
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <CreditCard size={20} className="text-blue-600" />
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        Credit / Debit Card
                        <span className="flex gap-2 text-2xl">
                          <Image
                            src="/visacard.svg"
                            alt="Visa"
                            width={25}
                            height={15}
                          />
                          <Image
                            src="/mastercard.svg"
                            alt="MasterCard"
                            width={25}
                            height={15}
                          />
                          <Image
                            src="/unionpay.svg"
                            alt="UnionPay"
                            width={25}
                            height={15}
                          />
                        </span>
                      </span>
                      <p className="text-sm text-gray-500">
                        Pay securely with your card
                      </p>
                    </div>
                  </label> */}

                  {/* Bank Transfer */}
                  <label className="flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="payment"
                      className="h-4 w-4 text-primary"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
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

            {/* Right Section - Order Summary */}
            <div className="bg-white rounded-2xl p-6 h-fit shadow-sm border border-gray-200 sticky top-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">
                Order Summary
              </h2>

              {/* Items List */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 pb-4 border-b last:border-none"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-800 font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      Rs {item.price.toLocaleString()}
                    </p>
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
                      <CheckCircle size={18} className="text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">
                        Promo applied!
                      </span>
                    </div>
                    <span className="text-green-700 font-medium">
                      -Rs {discount.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center w-full">
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
                      className="shrink-0 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark
             disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      <BadgePercent size={18} className="mr-1" />
                      Apply
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="text-red-500 text-sm mt-2">{promoError}</p>
                )}

                {/* <div className="mt-3 text-xs text-gray-500">
                  Try:{" "}
                  <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                    WELCOME10
                  </span>
                  ,
                  <span className="font-mono bg-gray-100 px-1 py-0.5 rounded mx-1">
                    PETLOVER15
                  </span>
                  , or
                  <span className="font-mono bg-gray-100 px-1 py-0.5 rounded mx-1">
                    FREESHIP
                  </span>
                </div> */}
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
                <div className="flex justify-between">
                  {/* <span>Tax</span> */}
                  {/* <span>Rs {tax.toLocaleString()}</span> */}
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
                <Shield size={30} className="mr-2 text-primary" />
                Secure checkout. Your information is safe with us.
              </div>

              {/* Place Order Button */}
              <button
                disabled={placing}
                onClick={async () => {
                  if (!cart || cart.items?.length === 0) return alert('Cart is empty');
                  
                  // Validate form before proceeding
                  if (!validateForm()) {
                    return;
                  }

                  setPlacing(true);
                  try {
                    const sessionId = getOrCreateGuestSessionId();
                    
                    // Clean phone number for API (remove spaces)
                    const cleanPhone = phone.replace(/\s/g, '');
                    
                    const body = {
                      userId: null,
                      sessionId,
                      cartId: cart.cart_id,
                      customerInfo: { 
                        email, 
                        phone: cleanPhone, 
                        name: fullName 
                      },
                      shippingAddress: { city, postalCode, address },
                      billingAddress: null,
                      paymentMethod,
                      notes: ''
                    };

                    const res = await fetch('/api/bazaar/orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(body),
                    });

                    const data = await res.json();
                    if (!res.ok) {
                      alert(data.message || data.error || 'Failed to place order');
                      setPlacing(false);
                      return;
                    }

                    const order = data.order;
                    // clear client-side cart (server already clears cart_items) so UI updates immediately
                    try {
                      dispatch(clearCart() as any);
                    } catch (e) {
                      // ignore dispatch errors in case redux isn't wired in this context
                      console.warn('Failed to clear client cart', e);
                    }
                    // also clear local cart state used on this page
                    setCart(null);
                    setCartItems([]);

                    // redirect to order confirmed with order number
                    router.push(`/order-confirmed?orderNumber=${encodeURIComponent(order.order_number)}`);
                  } catch (err) {
                    console.error('Place order failed', err);
                    alert('Failed to place order');
                  } finally {
                    setPlacing(false);
                  }
                }}
                className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
              >
                {placing ? 'Placing order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

// fetch cart on mount
function useLoadCart(setCart: any, setCartItems: any, setLoadingCart: any) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingCart(true);
      try {
        const sessionId = getOrCreateGuestSessionId();
        const res = await fetch(`/api/bazaar/cart?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setCart(json.cart);
        setCartItems((json.items || []).map((it: any) => ({ id: it.cart_item_id, name: it.product_title || '', price: Number(it.effective_price || 0), image: it.image_url || '/placeholder-product.jpg', quantity: it.quantity })));
      } catch (e) {
        console.warn('Failed to load cart', e);
      } finally {
        setLoadingCart(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
}