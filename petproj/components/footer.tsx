"use client";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-white px-6 md:px-16 py-10 rounded-t-3xl mt-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left - Logo & About */}
        <div>
          <img src="paltu_logo.svg" alt="paltuu logo" width={200} height={120} />
          <p className="mt-4 text-sm text-gray-200">
            Paltuu is your trusted pet marketplace. We connect pet lovers with
            the right companions and ensure a safe, loving adoption experience.
          </p>

          {/* Social Media Icons */}
          <div className="flex gap-4 mt-5">
            {/* <Link href="https://facebook.com" target="_blank">
              <Facebook className="w-5 h-5 hover:text-gray-300 transition" />
            </Link> */}
            <Link href="https://instagram.com/paltuupk" target="_blank">
              <Instagram className="w-5 h-5 hover:text-gray-300 transition" />
            </Link>
            <Link href="https://twitter.com/paltuupk" target="_blank">
              <Twitter className="w-5 h-5 hover:text-gray-300 transition" />
            </Link>
            {/* <Link href="https://youtube.com" target="_blank">
              <Youtube className="w-5 h-5 hover:text-gray-300 transition" />
            </Link> */}
          </div>
        </div>

        {/* Middle - Quick Links */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-gray-300">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-gray-300">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-gray-300">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/return-policy" className="hover:text-gray-300">
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
        <div>
          <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
          <p className="text-sm text-gray-200 mb-3">
            Subscribe to stay updated on the latest pets and offers.
          </p>
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-primary font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-400 mt-10 pt-6 text-center text-sm text-gray-200">
        © {new Date().getFullYear()} Paltuu. All rights reserved.
      </div>
    </footer>
  );
}
