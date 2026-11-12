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
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        },
        {
            label: "Twitter",
            icon: faTwitter,
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        },
        {
            label: "LinkedIn",
            icon: faLinkedinIn,
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        },
        {
            label: "WhatsApp",
            icon: faWhatsapp,
            href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
        },
    ];

    return (
        <div className="flex gap-2">
            {shareLinks.map(({ label, icon, href }) => (
                <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-primary hover:text-primary"
                    aria-label={`Share on ${label}`}
                >
                    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                </a>
            ))}
        </div>
    );
};

export default ShareButtons;
