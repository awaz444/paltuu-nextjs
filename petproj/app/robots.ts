import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/private/', // Example disallow
        },
        sitemap: 'https://paltuu.pk/sitemap.xml',
    };
}
