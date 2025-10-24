"use client";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

const hideFooterOn: string[] = ["/login", "/sign-up", "/partner-signup", "/auth", "/forgot-password", "/vet-register", "/rescue-register"];

if (hideFooterOn.includes(pathname)) {
  return null;
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus("error");
      setMessage("Please enter your email address");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Successfully subscribed to newsletter!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <footer className="bg-primary text-white px-6 md:px-16 py-10 rounded-t-3xl mt-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left - Logo, About & Address */}
        <div className="text-center md:text-left">
          <img
            src="paltuu bilkul tight.svg"
            alt="paltuu logo"
            width={90}
            height={100}
            className="mx-auto md:mx-0 text-white brightness-0 invert"
          />

          {/* Address */}
          <p className="mt-3 text-sm text-gray-300">
            Al Basit Tower, 4th floor, Gulshan e Jamal, opposite The Venue
          </p>
          <p className="text-sm text-gray-300">Karachi, Pakistan</p>
          <p className="text-sm text-gray-300">Phone: +92 3394022468</p>
          <p className="text-sm text-gray-300">Email: notifypaltuu@gmail.com</p>

          {/* Social Media Icons */}
          <div className="flex justify-center md:justify-start gap-4 mt-5">
            <Link href="https://instagram.com/paltuupk" target="_blank">
              <Instagram className="w-5 h-5 hover:text-gray-300 transition" />
            </Link>
            <Link href="https://twitter.com/paltuupk" target="_blank">
              <Twitter className="w-5 h-5 hover:text-gray-300 transition" />
            </Link>
            <Link href="https://facebook.com" target="_blank">
              <Facebook className="w-5 h-5 hover:text-gray-300 transition" />
            </Link>
          </div>
        </div>

        {/* Middle - Quick Links */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-gray-300">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-gray-300">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/refund&return-policy" className="hover:text-gray-300">
                Return Policy
              </Link>
            </li>
            <li>
              <Link href="/terms-and-conditions" className="hover:text-gray-300">
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Right - Newsletter */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
          <p className="text-sm text-gray-200 mb-3">
            Subscribe to stay updated on the latest pets and offers.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm mx-auto md:mx-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                className="w-full px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
                required
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-white text-primary font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
            
            {/* Status Message */}
            {message && (
              <p 
                className={`text-sm ${
                  status === "success" 
                    ? "text-green-300" 
                    : status === "error" 
                    ? "text-red-300" 
                    : "text-gray-300"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-400 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-200 gap-4">
        <p className="text-center md:text-left">
          © {new Date().getFullYear()} Paltuu. All rights reserved.
        </p>

        {/* Payment Icons */}
        {/* <div className="flex gap-3">
          <Image src="/visacard.svg" alt="Visa" width={35} height={20} />
          <Image src="/mastercard.svg" alt="MasterCard" width={35} height={20} />
          <Image src="/unionpay.svg" alt="UnionPay" width={35} height={20} />
        </div> */}
      </div>
    </footer>
  );
}