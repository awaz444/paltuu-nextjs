import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFacebook,
    faTwitter,
    faLinkedinIn,
    faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";

interface ShareButtonsProps {
    url: string;
    title: string;
}

const ShareButtons = ({ url, title }: ShareButtonsProps) => {
    const shareLinks = [
        {
            label: "Facebook",
            icon: faFacebook,
            bg: "bg-[#1877F2]",
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        },
        {
            label: "Twitter",
            icon: faTwitter,
            bg: "bg-[#1DA1F2]",
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        },
        {
            label: "LinkedIn",
            icon: faLinkedinIn,
            bg: "bg-[#0077b5]",
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        },
        {
            label: "WhatsApp",
            icon: faWhatsapp,
            bg: "bg-[#25D366]",
            href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
        },
    ];

    return (
        <div className="flex gap-2">
            {shareLinks.map(({ label, icon, bg, href }) => (
                <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-11 h-11 rounded-xl ${bg} text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300`}
                    aria-label={`Share on ${label}`}
                >
                    <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                </a>
            ))}
        </div>
    );
};

export default ShareButtons;
