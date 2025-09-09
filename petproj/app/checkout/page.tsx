"use client";
import { useState } from "react";
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

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const CheckoutPage = () => {
  const [cartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "Golden Retriever Puppy",
      price: 25000,
      image: "/pets/dog1.jpg",
      quantity: 1,
    },
    {
      id: 2,
      name: "Persian Cat",
      price: 18000,
      image: "/pets/cat1.jpg",
      quantity: 1,
    },
  ]);

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = 1200;
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + shipping + tax - discount;

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

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-10 px-4 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button className="flex items-center text-gray-600 hover:text-primary transition-colors mr-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your city"
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complete Address
                  </label>
                  <textarea
                    placeholder="Enter your complete address"
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
                <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    defaultChecked
                  />
                  <Banknote size={20} className="text-gray-600" />
                  <div>
                    <span className="text-gray-700 font-medium">
                      Cash on Delivery
                    </span>
                    <p className="text-sm text-gray-500">
                      Pay when you receive your order
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <CreditCard size={20} className="text-gray-600" />
                  <div>
                    <span className="text-gray-700 font-medium">
                      Credit / Debit Card
                    </span>
                    <p className="text-sm text-gray-500">
                      Pay securely with your card
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
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

              <div className="mt-3 text-xs text-gray-500">
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
              </div>
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
                <span>Tax</span>
                <span>Rs {tax.toLocaleString()}</span>
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
              <Shield size={30}className="mr-2 text-primary" />
              Secure checkout. Your information is safe with us.
            </div>

            {/* Place Order Button */}
            <button className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99]">
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
