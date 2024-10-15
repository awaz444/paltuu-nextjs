"use client";

import Link from "next/link";
import styles from "./navbar.module.css";

const Navbar = () => {
    return (
        <nav className={`${styles.navbar}`}>
            <div className="flex items-center justify-between">
                <Link href="/">
                    <div className={styles.logo}>
                        <img src="/paltu_logo.svg" alt="Logo" width={250} />
                    </div>
                </Link>

                <div className={`${styles.navLinks} flex items-center gap-5`}>
                    <Link href="/browse-pets">
                        <span className="hover:text-[#ffd2e3] cursor-pointer">
                            Browse Pets
                        </span>
                    </Link>
                    <Link href="/foster-pets">
                        <span className="hover:text-[#ffd2e3] cursor-pointer">
                            Foster Pets
                        </span>
                    </Link>
                    <Link href="/create-listing">
                        <span className="hover:text-[#ffd2e3] cursor-pointer">
                            Create Listing
                        </span>
                    </Link>
                    <Link href="/pet-care">
                        <span className="hover:text-[#ffd2e3] cursor-pointer">
                            Pet Care
                        </span>
                    </Link>
                    <Link href="/llm">
                        <span className="hover:text-[#ffd2e3] cursor-pointer">
                            Paltuu AI
                        </span>
                    </Link>
                    <Link href="/login">
                        <button
                            className={`${styles.loginBtn} hover:bg-[#ffd2e3] hover:text-[#70223f]`}>
                            Login
                        </button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
