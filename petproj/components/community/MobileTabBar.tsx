import Link from "next/link";
import { Home, PawPrint, Search, Smartphone, Stethoscope } from "lucide-react";

const TABS = [
    { href: "/home", label: "Home", Icon: Home },
    { href: "/browse-pets", label: "Adopt", Icon: PawPrint },
    { href: "/pet-care", label: "Vets", Icon: Stethoscope },
    { href: "/lost-and-found", label: "Lost & Found", Icon: Search },
    { href: "/app", label: "Get app", Icon: Smartphone },
];

/**
 * Social-app style bottom tabs on mobile, so Adopt and the rest of Paltuu are
 * one tap away from the feed instead of hidden in the menu. Only rendered on
 * Home, forum and post pages, where Home is always the current tab. The
 * spacer keeps the last post and the footer clear of the bar.
 */
export default function MobileTabBar() {
    return (
        <>
            <div aria-hidden className="h-16 lg:hidden" />
            <nav
                aria-label="Sections"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
            >
                <ul className="grid grid-cols-5">
                    {TABS.map(({ href, label, Icon }) => {
                        const active = href === "/home";
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                                        active ? "text-primary" : "text-gray-500"
                                    }`}
                                >
                                    <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                                    <span className="truncate">{label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
}
